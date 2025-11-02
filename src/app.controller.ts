// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from 'fastify';
import { loggerService } from '.';
import { getTazamaToken, fetchUsersByRole } from './logic.service';
import type { authBody } from './interfaces/login';
import { verifyToken } from '@tazama-lf/auth-lib/lib/services/jwtService';
import { extractTenant, type TazamaToken } from '@tazama-lf/auth-lib';
import type { UsersByRoleQuery } from './interfaces/query';
import { StatusCodes } from './interfaces/statusCodes';

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

    reply.code(StatusCodes.UNAUTHORIZED);
    reply.send('Unauthorized');
  } finally {
    loggerService.log(`End - ${logContext} request`);
  }
};

export const FetchUsersByRoleHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const logContext = 'FetchUsersByRoleHandler()';
  const authorizationHeader = req.headers.authorization;
  const query: UsersByRoleQuery = req.query! as UsersByRoleQuery;
  loggerService.log(`Start - ${logContext} request`);

  try {
    if (!authorizationHeader) {
      reply.code(StatusCodes.UNAUTHORIZED).send('Unauthorized');
      return;
    }
    const [, token] = authorizationHeader.split(' ');
    if (!token) {
      throw new Error('Unauthorized');
    }
    const decodedToken = verifyToken(token) as TazamaToken;
    const tenantResponse = extractTenant(true, authorizationHeader);
    if (!tenantResponse.success) {
      throw new Error('Unauthorized');
    }
    const roleName = (req.params as { rolename: string }).rolename;
    const users = await fetchUsersByRole(decodedToken, query.groupName, roleName);
    reply.code(StatusCodes.OK).send(users);
  } catch (err) {
    const error = err as Error;
    const failMessage = `${error.name}: ${error.message}\n${error.stack}`;
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
