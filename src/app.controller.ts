// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from 'fastify';
import { loggerService } from '.';
import { getTazamaToken, fetchUsersByRole } from './logic.service';
import type { authBody } from './interfaces/login';
import type { UsersByRoleQuery } from './interfaces/query';
import { StatusCodes } from './interfaces/statusCodes';
import { authenticateRequest } from './utils/authHelpers';

export const LoginHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const logContext = 'LoginHandler()';
  loggerService.log(`Start - ${logContext} request`);
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
    loggerService.log(`End - ${logContext} request`);
  }
};

export const FetchGroup = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const logContext = 'FetchGroup()';
  loggerService.log(`Start - ${logContext} request`);
  const authorizationHeader = req.headers.authorization;
  const query: UsersByRoleQuery = req.query! as UsersByRoleQuery;

  const { groupName, subGroupRoleName } = query;

  // Validate groupName is provided and not empty
  if (!groupName || groupName.trim() === '') {
    reply.code(StatusCodes.BAD_REQUEST).send('groupName query parameter is required');
    return;
  }

  try {
    const authResult = authenticateRequest(authorizationHeader);

    if (!authResult.success) {
      reply.code(authResult.statusCode).send(authResult.message);
      return;
    }

    // Get role name from route params (if present) or fallback to query param
    const roleName = (req.params as { rolename: string }).rolename ?? subGroupRoleName;
    const response = await fetchUsersByRole(authResult.decodedToken, groupName, roleName);

    reply.code(StatusCodes.OK).send(response);
  } catch (error) {
    const err = error as Error;
    const failMessage = `${err.name}: ${err.message}\n${err.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal Server Error');
  } finally {
    loggerService.log(`End - ${logContext} request`);
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP',
});

export { handleHealthCheck };
