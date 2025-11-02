export interface KeycloakGroupAccess {
  view: boolean;
  viewMembers: boolean;
  manageMembers: boolean;
  manage: boolean;
  manageMembership: boolean;
}

export interface KeycloakGroup {
  id: string;
  name: string;
  description: string;
  path: string;
  subGroupCount: number;
  subGroups: KeycloakGroup[];
  access: KeycloakGroupAccess;
}

export interface KeycloakSubGroup extends KeycloakGroup {
  parentId: string;
  attributes: Record<string, unknown>;
  realmRoles: string[];
  clientRoles: Record<string, string[]>;
}

export interface KeycloakGroupMember {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified: boolean;
  enabled: boolean;
  createdTimestamp: number;
  totp: boolean;
  disableableCredentialTypes: string[];
  requiredActions: string[];
  notBefore: number;
}
