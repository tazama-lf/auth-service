// SPDX-License-Identifier: Apache-2.0
import { type FastifyReply, type FastifyRequest } from 'fastify';
import { loggerService } from '.';
import { getTazamaToken } from './logic.service';
import { type authBody } from './interfaces/login';

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

const handleHealthCheck = async (): Promise<{ status: string }> => {
  return {
    status: 'UP',
  };
};

export { handleHealthCheck };
