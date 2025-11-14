// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from 'fastify';
import { loggerService } from '.';
import { getTazamaToken, fetchUsersByRole, newFetchUsersByRole } from './logic.service';
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

  //group name is usersbyrolequery
  const query: UsersByRoleQuery = req.query! as UsersByRoleQuery;

  loggerService.log(`Start - ${logContext} request`, 'FetchUsersByRoleHandler app.controller.ts');
  loggerService.log(`Query Params: ${JSON.stringify(query)}`, 'FetchUsersByRoleHandler app.controller.ts');

  try {
    if (!authorizationHeader) {
      reply.code(StatusCodes.UNAUTHORIZED).send('Unauthorized');
      return;
    }

    const [, token] = authorizationHeader.split(' ');
    if (!token) {
      throw new Error('Unauthorized');
    }

    loggerService.log(`1. token: ${token}`, 'FetchUsersByRoleHandler app.controller.ts');

    const decodedToken = verifyToken(token) as TazamaToken;

    loggerService.log(`2. decodedToken: ${JSON.stringify(decodedToken)}`, 'FetchUsersByRoleHandler app.controller.ts');

    const tenantResponse = extractTenant(true, authorizationHeader);

    loggerService.log(`3.tenantResponse: ${JSON.stringify(tenantResponse)}`, 'FetchUsersByRoleHandler app.controller.ts');

    if (!tenantResponse.success) {
      throw new Error('Unauthorized');
    }

    const roleName = (req.params as { rolename: string }).rolename;

    loggerService.log(`4. roleName: ${roleName}`, 'FetchUsersByRoleHandler app.controller.ts');

    // group name is from query param "Tenant_002"
    const users = await fetchUsersByRole(decodedToken, query.groupName, roleName);
    loggerService.log(`5. users: ${JSON.stringify(users)}`, 'FetchUsersByRoleHandler app.controller.ts');

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

export const FetchGroup = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  // using group name and tenantID
  // {{baseurl}}/admin/realms/{{realm}}/groups?briefRepresentation=false&groupName={{group_name}}

  const logContext = 'FetchGroup()';
  loggerService.log(`Start - ${logContext} request`);

  const authorizationHeader = req.headers.authorization;
  const query: UsersByRoleQuery = req.query! as UsersByRoleQuery;

  const { groupName, subGroupRoleName } = query;
  if (!groupName) {
    //throw bad request error
    reply.code(400).send('groupName query parameter is required');
    return;
  }

  try {
    // Implementation to fetch group by name and tenantId goes here
    if (!authorizationHeader) {
      reply.code(StatusCodes.UNAUTHORIZED).send('Authorization header is missing');
      return;
    }

    const [, token] = authorizationHeader.split(' ');
    if (!token) {
      reply.code(StatusCodes.UNAUTHORIZED).send('Bearer Token is missing');
      return;
    }

    const verifiedAndDecodedToken = verifyToken(token) as TazamaToken;
    const tenantResponse = extractTenant(true, authorizationHeader);

    if (!tenantResponse.success) {
      reply.code(StatusCodes.UNAUTHORIZED).send('Tenant response is not successful(false)');
      return;
    }

    const response = await newFetchUsersByRole(verifiedAndDecodedToken, groupName, subGroupRoleName);

    reply.code(StatusCodes.OK).send(response);
  } catch (error) {
    const err = error as Error;
    const failMessage = `${err.name}: ${err.message}\n${err.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
  } finally {
    loggerService.log(`End - ${logContext} request`);
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP1',
});

export { handleHealthCheck };
