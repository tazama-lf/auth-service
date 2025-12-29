import { getTazamaToken, fetchUsersByRole, newFetchUsersByRole } from '../../src/logic.service';
import type { TazamaToken } from '@tazama-lf/auth-lib';

// TazamaAuthentication mocked in jest.setup.ts

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
process.env.AUTH_URL = 'https://test-auth.com';
process.env.KEYCLOAK_REALM = 'test-realm';

describe('App Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTazamaToken', () => {
    it('should handle getToken from library - happy path', async () => {
      const authBody = {
        username: 'user',
        password: 'password',
      };

      const tazamaToken = await getTazamaToken(authBody);

      expect(typeof tazamaToken).toEqual('string');
      expect(tazamaToken).toBeDefined();
    });

    it('should handle getToken from library - blank token', async () => {
      const authBody = {
        username: 'blank',
        password: 'password',
      };

      try {
        await getTazamaToken(authBody);
        throw new Error('UNREACHABLE');
      } catch (err) {
        // logic.service.ts throws an Error with message containing the username
        expect((err as Error).message).toBe(`Could not get Tazama token for username: ${authBody.username}`);
      }
    });

    it('should handle getToken from library - error from getToken', async () => {
      const authBody = {
        username: 'reject',
        password: 'password',
      };

      try {
        await getTazamaToken(authBody);
        throw new Error('UNREACHABLE');
      } catch (err) {
        // jest.setup mock rejects with a raw string 'REJECT', ensure test accepts that
        if (typeof err === 'string') {
          expect(err).toBe('REJECT');
        } else {
          expect((err as Error).message).toBe('REJECT');
        }
      }
    });
  });

  describe('fetchUsersByRole', () => {
    const mockToken = {
      tokenString: 'mock-token',
    } as any;

    it('should fetch users by role successfully', async () => {
      const mockGroupDetails = [{ id: 'group-1', name: 'test-group' }];
      const mockSubGroups = [{ id: 'subgroup-1', realmRoles: ['test-role'] }];
      const mockMembers = [{ id: 'user-1', username: 'testuser' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockSubGroups),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMembers),
        });

      const result = await fetchUsersByRole(mockToken, 'test-group', 'test-role');

      expect(result).toEqual(mockMembers);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle fetchUsersByRole error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('getUsersByRole retrieval failed'));
      }
    });

    it('should handle fetchUserGroupDetails error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('getUsersByRole retrieval failed'));
      }
    });

    it('should handle fetchSubGroups error', async () => {
      const mockGroupDetails = [{ id: 'group-1', name: 'test-group' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('getUsersByRole retrieval failed'));
      }
    });

    it('should handle fetchSubGroupMembers error', async () => {
      const mockGroupDetails = [{ id: 'group-1', name: 'test-group' }];
      const mockSubGroups = [{ id: 'subgroup-1', realmRoles: ['test-role'] }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockSubGroups),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('getUsersByRole retrieval failed'));
      }
    });

    it('should handle case when no sub group matches the role name', async () => {
      const mockGroupDetails = [{ id: 'group-1', name: 'test-group' }];
      // subGroups do not include the requested role
      const mockSubGroups = [{ id: 'subgroup-1', realmRoles: ['other-role'] }];
      const mockMembers = [{ id: 'user-1', username: 'testuser' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockGroupDetails) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockSubGroups) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockMembers) });

      const result = await fetchUsersByRole(mockToken, 'test-group', 'test-role');

      expect(result).toEqual(mockMembers);
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('newFetchUsersByRole', () => {
    const mockToken = {
      tokenString: 'mock-token',
      tenantId: 'tenant-123',
    } as any;

    it('should fetch users by role successfully without subGroup', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['tenant-123'],
          },
          subGroupCount: 0,
        },
      ];
      const mockMembers = [{ id: 'user-1', username: 'testuser' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMembers),
        });

      const result = await newFetchUsersByRole(mockToken, 'test-group');

      expect(result).toEqual(mockMembers);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fetch users by role successfully with subGroup', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['tenant-123'],
          },
          subGroupCount: 1,
        },
      ];
      const mockSubGroups = [{ id: 'subgroup-1', name: 'admin-role' }];
      const mockMembers = [{ id: 'user-1', username: 'testuser' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockSubGroups),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockMembers),
        });

      const result = await newFetchUsersByRole(mockToken, 'test-group', 'admin-role');

      expect(result).toEqual(mockMembers);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle no group found with group name', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve([]),
      });

      try {
        await newFetchUsersByRole(mockToken, 'non-existent-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found with the group name: non-existent-group'));
      }
    });

    it('should handle no group found for tenant', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['different-tenant'],
          },
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await newFetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found for the tenanttenant-123'));
      }
    });

    it('should handle no sub groups found for tenant group', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['tenant-123'],
          },
          subGroupCount: 0,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await newFetchUsersByRole(mockToken, 'test-group', 'admin-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No sub groups found for the tenant group: group-1'));
      }
    });

    it('should handle no sub group found with role name', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['tenant-123'],
          },
          subGroupCount: 1,
        },
      ];
      const mockSubGroups = [{ id: 'subgroup-1', name: 'different-role' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockSubGroups),
        });

      try {
        await newFetchUsersByRole(mockToken, 'test-group', 'admin-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No sub group found with the role name: admin-role'));
      }
    });

    it('should handle fetchUserGroupDetails error with string', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce('STRING_ERROR');

      try {
        await newFetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toBe('STRING_ERROR');
      }
    });

    it('should handle fetchSubGroups error', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['tenant-123'],
          },
          subGroupCount: 1,
        },
      ];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await newFetchUsersByRole(mockToken, 'test-group', 'admin-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('should handle fetchGroupMembers error', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            TENANT_ID: ['tenant-123'],
          },
          subGroupCount: 0,
        },
      ];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await newFetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('should handle group with missing attributes', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          // No attributes property
          subGroupCount: 0,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await newFetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found for the tenanttenant-123'));
      }
    });

    it('should handle group with undefined TENANT_ID', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: {
            // TENANT_ID is undefined
          },
          subGroupCount: 0,
        },
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await newFetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found for the tenanttenant-123'));
      }
    });
  });
});
