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
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(500);
    reply.send(failMessage);
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
