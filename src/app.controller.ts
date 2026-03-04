// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from 'fastify';
import { loggerService } from '.';
import { getTazamaToken, fetchUsersByRole } from './logic.service';
import type { authBody } from './interfaces/login';
import { verifyToken } from '@tazama-lf/auth-lib/lib/services/jwtService';
import { extractTenant, type TazamaToken } from '@tazama-lf/auth-lib';
import type { UsersByRoleQuery } from './interfaces/query';
import { StatusCodes } from './interfaces/statusCodes';

interface AuthResult {
  success: true;
  decodedToken: TazamaToken;
}

interface AuthError {
  success: false;
  statusCode: StatusCodes;
  message: string;
}

type AuthenticationResult = AuthResult | AuthError;

/**
 * Authenticates and authorizes the request by validating the authorization header,
 * extracting and verifying the token, and validating the tenant.
 * @param authorizationHeader - The authorization header from the request
 * @returns AuthenticationResult containing either the decoded token or error details
 */
const authenticateRequest = (authorizationHeader: string | undefined): AuthenticationResult => {
  if (!authorizationHeader) {
    return {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Authorization header is missing',
    };
  }

  const [, token] = authorizationHeader.split(' ');
  if (!token) {
    return {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Bearer Token is missing',
    };
  }

  try {
    const decodedToken = verifyToken(token) as TazamaToken;
    const tenantResponse = extractTenant(true, authorizationHeader);

    if (!tenantResponse.success) {
      return {
        success: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Tenant response is not successful(false)',
      };
    }

    return {
      success: true,
      decodedToken,
    };
  } catch (err) {
    const error = err as Error;
    loggerService.error(`Token verification failed: ${error.message}`, 'authenticateRequest');
    return {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Unauthorized',
    };
  }
};

export const LoginHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const body = req.body as authBody;
    const response = await getTazamaToken(body);

    reply.code(StatusCodes.OK);
    reply.send(response);
  } catch (err) {
    const error = err as Error;
    const failMessage = `${error.name}: ${error.message}\n${error.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    if (error.message.includes('Account temporarily locked due to too many failed login attempts.')) {
      reply.code(StatusCodes.TOO_MANY_REQUESTS);
      reply.send({ message: error.message });
    } else {
      reply.code(StatusCodes.UNAUTHORIZED);
      reply.send({ message: error.message });
    }
  } finally {
    loggerService.log('End - LoginHandler() request');
  }
};

export const FetchUsersByRoleHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const authorizationHeader = req.headers.authorization;
  const query: UsersByRoleQuery = req.query! as UsersByRoleQuery;

  try {
    const authResult = authenticateRequest(authorizationHeader);

    if (!authResult.success) {
      reply.code(authResult.statusCode).send(authResult.message);
      return;
    }

    const roleName = (req.params as { rolename: string }).rolename;
    const users = await fetchUsersByRole(authResult.decodedToken, query.groupName, roleName);

    reply.code(StatusCodes.OK).send(users);
  } catch (err) {
    const error = err as Error;
    const failMessage = `${error.name}: ${error.message}\n${error.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
  } finally {
    loggerService.log('End - FetchUsersByRoleHandler() request');
  }
};

export const FetchGroup = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const authorizationHeader = req.headers.authorization;
  const query: UsersByRoleQuery = req.query! as UsersByRoleQuery;

  const { groupName, subGroupRoleName } = query;
  if (!groupName) {
    reply.code(StatusCodes.BAD_REQUEST).send('groupName query parameter is required');
    return;
  }

  try {
    const authResult = authenticateRequest(authorizationHeader);

    if (!authResult.success) {
      reply.code(authResult.statusCode).send(authResult.message);
      return;
    }

    const response = await fetchUsersByRole(authResult.decodedToken, groupName, subGroupRoleName);

    reply.code(StatusCodes.OK).send(response);
  } catch (error) {
    const err = error as Error;
    const failMessage = `${err.name}: ${err.message}\n${err.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  } finally {
    loggerService.log('End - FetchGroup() request');
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP',
});

export { handleHealthCheck };
