// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from 'fastify';
import { loggerService } from '.';
import { getTazamaToken } from './logic.service';
import type { authBody } from './interfaces/login';

export const LoginHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const logContext = 'LoginHandler()';
  loggerService.log(`Start - ${logContext} request`);

  try {
    const body = req.body as authBody;
    const response = await getTazamaToken(body);

    reply.code(200);
    reply.send(response);
  } catch (err) {
    const error = err as Error;
    const failMessage = `${error.name}: ${error.message}\n${error.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(401);
    reply.send('Unauthorized');
  } finally {
    loggerService.log(`End - ${logContext} request`);
  }
};

export const FetchUsersByRoleHandler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const logContext = 'FetchUsersByRoleHandler()';
  loggerService.log(`Start - ${logContext} request`);

  try {
    // if (req.headers.authorization === undefined) {
    //   reply.code(401).send('Unauthorized');
    //   return;
    // }
    // const roleName = (req.params as { rolename: string }).rolename;
    // const users = await fetchUsersByRole(req.headers.authorization, roleName);
    // reply.code(200).send(users);
  } catch (err) {
    const error = err as Error;
    const failMessage = `${error.name}: ${error.message}\n${error.stack}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(500).send('Internal Server Error');
  } finally {
    loggerService.log(`End - ${logContext} request`);
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP',
});

export { handleHealthCheck };
