import { AuthenticationService } from '@frmscoe/auth-lib';
import { LoggerService } from '@frmscoe/frms-coe-lib';
import initializeFastifyClient from './clients/fastify';
import { configuration } from './config';

export const loggerService: LoggerService = new LoggerService();
export const authService: AuthenticationService = new AuthenticationService();

const serve = async (): Promise<void> => {
  const fastify = await initializeFastifyClient();
  const { port, host } = configuration.service;
  fastify.listen({ port, host }, (err, address) => {
    if (err) {
      throw Error(`${err.message}`);
    }
    loggerService.log(`Fastify listening on ${address}`);
  });
};

(async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await serve();
    }
  } catch (err) {
    loggerService.error(`Error while starting ${configuration.app} server`, err);
    process.exit(1);
  }
})();
