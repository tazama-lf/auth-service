// SPDX-License-Identifier: Apache-2.0
import { authService, loggerService } from '.';
import { type authBody } from './interfaces/login';

export const getTazamaToken = async (auth: authBody): Promise<string> => {
  const logContext = 'handleLogin()';
  try {
    const token = await authService.getToken(auth.username, auth.password);

    if (!token) {
      loggerService.log(`Could not get Tazama token for username: ${auth.username}`, logContext);
    }

    return token;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`);
    throw err;
  }
};
