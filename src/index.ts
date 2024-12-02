import { AuthenticationService } from '@frmscoe/auth-lib';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import initializeFastifyClient from './clients/fastify';
import { config } from './config';
import { validateLogConfig } from '@tazama-lf/frms-coe-lib/lib/config';

export const loggerService: LoggerService = new LoggerService(config);
export const authService: AuthenticationService = new AuthenticationService();

const serve = async (): Promise<void> => {
  const fastify = await initializeFastifyClient();
  fastify.listen({ port: config.PORT, host: config.HOST }, (err, address) => {
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
    loggerService.error(`Error while starting ${config.functionName} server`, err);
    process.exit(1);
  }
})();
