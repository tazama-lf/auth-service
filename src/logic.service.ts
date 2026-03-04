// SPDX-License-Identifier: Apache-2.0
import { authService, loggerService } from '.';
import type { authBody } from './interfaces/login';
import type { TazamaToken } from '@tazama-lf/auth-lib';
import type { KeycloakGroup, KeycloakGroupMember, KeycloakSubGroup } from '@tazama-lf/auth-lib-provider-keycloak';
import { ZERO, KEYCLOAK_REQUEST_TIMEOUT } from './constants';

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
    const groupDetails = await fetchUserGroupDetails(decodedToken, groupName);
    if (groupDetails.length === ZERO) {
      throw new Error('No group found with the group name: ' + groupName);
    }
    const tenantGroup = groupDetails.find((group) => {
      try {
        const attrs = (group as unknown as Record<string, unknown>).attributes as Record<string, unknown>;
        return (attrs.TENANT_ID as string[]).includes(decodedToken.tenantId);
      } catch {
        return false;
      }
    });

    if (!tenantGroup) {
      throw new Error('No group found for the tenant ' + decodedToken.tenantId);
    }

    let groupId = tenantGroup.id;

    if (subGroupRoleName) {
      if (tenantGroup.subGroupCount === ZERO) {
        throw new Error('No sub groups found for the tenant group: ' + tenantGroup.id);
      } else {
        const subGroups = await fetchSubGroups(decodedToken, tenantGroup.id ?? '');

        const filteredSubGroup = subGroups.find((group: KeycloakSubGroup) => group.name === subGroupRoleName);

        if (!filteredSubGroup) {
          throw new Error('No sub group found with the role name: ' + subGroupRoleName);
        }
        groupId = filteredSubGroup.id;
      }
    }
    const subGroupMembers = await fetchGroupMembers(decodedToken, groupId ?? '');
    return subGroupMembers;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, 'fetchUsersByRole()');
    throw error;
  }
};

export const fetchUserGroupDetails = async (decodedToken: TazamaToken, userGroup: string): Promise<KeycloakGroup[]> => {
  try {
    const encodedUserGroup = encodeURIComponent(userGroup);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, KEYCLOAK_REQUEST_TIMEOUT);

    const response = await fetch(
      `${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups?search=${encodedUserGroup}&briefRepresentation=false`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${decodedToken.tokenString}`,
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Keycloak API error: ${response.status} ${response.statusText}`);
    }

    const groupDetails = await response.json();
    return groupDetails as KeycloakGroup[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, 'fetchUserGroupDetails()');
    throw error;
  }
};

export const fetchSubGroups = async (decodedToken: TazamaToken, groupId: string): Promise<KeycloakSubGroup[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, KEYCLOAK_REQUEST_TIMEOUT);

    const response = await fetch(`${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups/${groupId}/children`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${decodedToken.tokenString}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Keycloak API error: ${response.status} ${response.statusText}`);
    }

    const subGroupDetails = await response.json();
    return subGroupDetails as KeycloakSubGroup[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, 'fetchSubGroups()');
    throw error;
  }
};

export const fetchGroupMembers = async (decodedToken: TazamaToken, subGroupId: string): Promise<KeycloakGroupMember[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, KEYCLOAK_REQUEST_TIMEOUT);

    const response = await fetch(`${process.env.AUTH_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/groups/${subGroupId}/members`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${decodedToken.tokenString}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Keycloak API error: ${response.status} ${response.statusText}`);
    }

    const members = await response.json();
    return members as KeycloakGroupMember[];
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, 'fetchGroupMembers()');
    throw error;
  }
};
