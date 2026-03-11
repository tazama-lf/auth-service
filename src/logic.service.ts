// SPDX-License-Identifier: Apache-2.0
import { authService, loggerService } from '.';
import type { authBody } from './interfaces/login';
import type { TazamaToken } from '@tazama-lf/auth-lib';
import { keycloakProvider, type KeycloakGroupMember } from '@tazama-lf/auth-lib-provider-keycloak';

export const getTazamaToken = async (auth: authBody): Promise<string> => {
  try {
    const token = await authService.getToken(auth.username, auth.password);

    if (!token) {
      const errMsg = `Could not get Tazama token for username: ${auth.username}`;
      throw new Error(errMsg);
    }

    return token;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, 'getTazamaToken()');
    throw error;
  }
};

export const fetchUsersByRole = async (
  decodedToken: TazamaToken,
  groupName: string,
  subGroupRoleName?: string,
): Promise<KeycloakGroupMember[]> => {
  try {
    return await keycloakProvider.fetchUsersByRole(decodedToken, groupName, subGroupRoleName);
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, 'fetchUsersByRole()');
    throw error;
  }
};
