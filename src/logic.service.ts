// SPDX-License-Identifier: Apache-2.0
import { authService, loggerService } from '.';
import type { authBody } from './interfaces/login';
import type { TazamaToken } from '@tazama-lf/auth-lib';
import type { KeycloakGroup, KeycloakGroupMember, KeycloakSubGroup } from './interfaces/keycloakGroup';

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

export const fetchUsersByRole = async (decodedToken: TazamaToken, userGroup: string, roleName: string): Promise<KeycloakGroupMember[]> => {
  const logContext = 'getUsersByRole()';
  const FIRST_INDEX = 0;
  loggerService.log(`Start - ${logContext}`);
  try {
    const groupDetails = await fetchUserGroupDetails(decodedToken, userGroup);
    const subGroups = await fetchSubGroups(decodedToken, groupDetails[FIRST_INDEX].id);
    const subGroupId = subGroups.find((group: KeycloakSubGroup) => group.realmRoles.includes(roleName))?.id;
    const subGroupMembers = await fetchSubGroupMembers(decodedToken, subGroupId!);
    return subGroupMembers;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    throw new Error('getUsersByRole retrieval failed');
  }
};

const fetchUserGroupDetails = async (decodedToken: TazamaToken, userGroup: string): Promise<KeycloakGroup[]> => {
  const logContext = 'fetchUserGroupDetails()';
  loggerService.log(`Start - ${logContext}`);
  try {
    const response = await fetch(`${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups?search=${userGroup}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${decodedToken.tokenString}`,
      },
    });
    const groupDetails = await response.json();
    return groupDetails as KeycloakGroup[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    throw new Error('fetchUserGroupDetails retrieval failed');
  }
};

const fetchSubGroups = async (decodedToken: TazamaToken, groupId: string): Promise<KeycloakSubGroup[]> => {
  const logContext = 'fetchSubGroups()';
  loggerService.log(`Start - ${logContext}`);
  try {
    const response = await fetch(`${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups/${groupId}/children`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${decodedToken.tokenString}`,
      },
    });
    const subGroupDetails = await response.json();
    return subGroupDetails as KeycloakSubGroup[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    throw new Error('fetchSubGroups retrieval failed');
  }
};

const fetchSubGroupMembers = async (decodedToken: TazamaToken, subGroupId: string): Promise<KeycloakGroupMember[]> => {
  const logContext = 'fetchSubGroupMembers()';
  loggerService.log(`Start - ${logContext}`);
  try {
    const response = await fetch(`${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups/${subGroupId}/members`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${decodedToken.tokenString}`,
      },
    });
    const members = await response.json();
    return members as KeycloakGroupMember[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    throw new Error('fetchSubGroupMembers retrieval failed');
  }
};
