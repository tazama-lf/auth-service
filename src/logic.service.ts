// SPDX-License-Identifier: Apache-2.0
import { authService, loggerService } from '.';
import type { authBody } from './interfaces/login';
import type { TazamaToken } from '@tazama-lf/auth-lib';
import type { KeycloakGroup, KeycloakGroupMember, KeycloakSubGroup } from '@tazama-lf/auth-lib-provider-keycloak';

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
    throw error;
  }
};

export const fetchUsersByRole = async (
  decodedToken: TazamaToken,
  groupName: string,
  subGroupRoleName?: string,
): Promise<KeycloakGroupMember[]> => {
  const logContext = 'getUsersByRole()';

  loggerService.log(`Start - ${logContext}`);
  try {
    // decodedToken.tenantId --> parent
    const groupDetails = await fetchUserGroupDetails(decodedToken, groupName);
    if (groupDetails.length === 0) {
      throw new Error('No group found with the group name: ' + groupName);
    }
    loggerService.log(`1. Group Details: ${JSON.stringify(groupDetails)}`, 'getUsersByRole() logic.service.ts');

    // filter group by tenantId (this was missing in previous code)
    const tenantGroup = groupDetails.find((group) => group.attributes?.TENANT_ID?.includes(decodedToken.tenantId));

    if (!tenantGroup) {
      throw new Error('No group found for the tenant' + decodedToken.tenantId);
    }

    // parent ki id
    let groupId = tenantGroup.id;

    if (subGroupRoleName) {
      if (tenantGroup.subGroupCount === 0) {
        // query param main role name hai but tenant group ke koi sub group nahi hai
        throw new Error('No sub groups found for the tenant group: ' + tenantGroup.id);
      } else {
        const subGroups = await fetchSubGroups(decodedToken, tenantGroup.id);
        loggerService.log(`2. Sub Groups: ${JSON.stringify(subGroups)}`, 'getUsersByRole() logic.service.ts');

        const filteredSubGroup = subGroups.find((group: KeycloakSubGroup) => group.name === subGroupRoleName);

        if (!filteredSubGroup) {
          throw new Error('No sub group found with the role name: ' + subGroupRoleName);
        }

        // child group id
        groupId = filteredSubGroup.id;
      }
    }

    loggerService.log(`3. Sub Group ID: ${groupId}`, 'getUsersByRole() logic.service.ts');
    const subGroupMembers = await fetchGroupMembers(decodedToken, groupId);
    loggerService.log(`4. Sub Group Members: ${JSON.stringify(subGroupMembers)}`, 'getUsersByRole() logic.service.ts');
    loggerService.log(`end - ${logContext}`);
    return subGroupMembers;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    loggerService.log(`end - ${logContext}`);
    throw error;
  }
};

export const fetchUserGroupDetails = async (decodedToken: TazamaToken, userGroup: string): Promise<KeycloakGroup[]> => {
  const logContext = 'fetchUserGroupDetails()';
  loggerService.log(`Start - ${logContext}`);
  loggerService.log('userGroup:', userGroup);
  loggerService.log('poori line:', `${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups?search=${userGroup}`);

  try {
    const response = await fetch(
      `${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups?search=${userGroup}&briefRepresentation=false`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${decodedToken.tokenString}`,
        },
      },
    );
    const groupDetails = await response.json();
    loggerService.log(`end - ${logContext}`);
    return groupDetails as KeycloakGroup[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    loggerService.log(`end - ${logContext}`);
    throw error;
  }
};

export const fetchSubGroups = async (decodedToken: TazamaToken, groupId: string): Promise<KeycloakSubGroup[]> => {
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
    throw error;
  }
};

export const fetchGroupMembers = async (decodedToken: TazamaToken, subGroupId: string): Promise<KeycloakGroupMember[]> => {
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
    throw error;
  }
};
