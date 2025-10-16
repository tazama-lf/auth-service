// SPDX-License-Identifier: Apache-2.0
// import { verifyToken } from '@tazama-lf/auth-lib/lib/services/jwtService';
import { authService, loggerService } from '.';
import type { authBody } from './interfaces/login';
// import { extractTenant, TazamaToken } from '@tazama-lf/auth-lib';
// import { getUsersByRole } from '@tazama-lf/auth-lib/lib/services/tazamaService';

export const getTazamaToken = async (auth: authBody): Promise<string> => {
  const logContext = 'getTazamaToken()';
  try {
    const token = await authService.getToken(auth.username, auth.password);

    if (!token) {
      const errMsg = `Could not get Tazama token for username: ${auth.username}`;
      throw new Error(errMsg);
    }

    return token;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    throw new Error('getTazamaToken retrieval failed');
  }
};

// export const fetchUsersByRole = async (authorizationHeader: string, roleName: string): Promise<string[]> => {
//   const logContext = 'getUsersByRole()';
//   try {
//     const decodedToken = verifyToken(authorizationHeader) as TazamaToken;
//     const tenantResponse = extractTenant(true, authorizationHeader);
//     if (!tenantResponse.success) {
//       throw new Error('Unauthorized');
//     }
//     const users = await getUsersByRole(decodedToken.tokenString, roleName);
//     return users;
//   } catch (error) {
//     const err = error as Error;
//     loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
//     throw new Error('getUsersByRole retrieval failed');
//   }
// };
