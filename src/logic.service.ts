// SPDX-License-Identifier: Apache-2.0
import { authService, loggerService } from '.';
import { type authBody } from './interfaces/login';

export const getTazamaToken = async (auth: authBody): Promise<string | undefined> => {
  const logContext = 'getTazamaToken()';
  try {
    const token = await authService.getToken(auth.username, auth.password);

    if (!token) {
      loggerService.error(`Could not get Tazama token for username: ${auth.username}`, logContext);
      return;
    }

    return token;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    throw new Error('getTazamaToken retrieval failed');
  }
};
