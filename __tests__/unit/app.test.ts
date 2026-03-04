import { getTazamaToken, fetchUsersByRole } from '../../src/logic.service';
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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
      tenantId: 'tenant-123',
    } as any;

    it('should fetch users by role successfully', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: { TENANT_ID: ['tenant-123'] },
          subGroupCount: 1,
        },
      ];
      const mockSubGroups = [{ id: 'subgroup-1', name: 'test-role' }];
      const mockMembers = [{ id: 'user-1', username: 'testuser' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGroupDetails) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSubGroups) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });

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
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('should handle fetchUserGroupDetails error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('should handle fetchSubGroups error', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: { TENANT_ID: ['tenant-123'] },
          subGroupCount: 1,
        },
      ];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGroupDetails) })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('should handle fetchSubGroupMembers error', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: 'group-1', name: 'test-group', attributes: { TENANT_ID: ['tenant-123'] }, subGroupCount: 1 }]),
        })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 'subgroup-1', name: 'test-role' }]) })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('should handle case when no sub group matches the role name', async () => {
      const mockGroupDetails = [
        {
          id: 'group-1',
          name: 'test-group',
          attributes: { TENANT_ID: ['tenant-123'] },
          subGroupCount: 1,
        },
      ];
      // subGroups do not include the requested role
      const mockSubGroups = [{ id: 'subgroup-1', name: 'other-role' }];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGroupDetails) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSubGroups) });

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'test-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No sub group found with the role name: test-role'));
      }
    });
  });

  describe('fetchUsersByRole', () => {
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
          ok: true,
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMembers),
        });

      const result = await fetchUsersByRole(mockToken, 'test-group');

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
          ok: true,
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubGroups),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMembers),
        });

      const result = await fetchUsersByRole(mockToken, 'test-group', 'admin-role');

      expect(result).toEqual(mockMembers);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle no group found with group name', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      try {
        await fetchUsersByRole(mockToken, 'non-existent-group');
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
        ok: true,
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await fetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found for the tenant tenant-123'));
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
        ok: true,
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'admin-role');
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
          ok: true,
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubGroups),
        });

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'admin-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No sub group found with the role name: admin-role'));
      }
    });

    it('should handle fetchUserGroupDetails error with string', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce('STRING_ERROR');

      try {
        await fetchUsersByRole(mockToken, 'test-group');
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
          ok: true,
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'admin-role');
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
          ok: true,
          json: () => Promise.resolve(mockGroupDetails),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchUsersByRole(mockToken, 'test-group');
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
        ok: true,
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await fetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found for the tenant tenant-123'));
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
        ok: true,
        json: () => Promise.resolve(mockGroupDetails),
      });

      try {
        await fetchUsersByRole(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('No group found for the tenant tenant-123'));
      }
    });
  });

  describe('Internal fetch functions', () => {
    const mockToken = {
      tokenString: 'mock-token',
      exp: 0,
      sid: 'sid',
      iss: 'issuer',
      clientId: 'client',
      tenantId: 'tenant-123',
    } as any;

    it('fetchUserGroupDetails returns group details', async () => {
      const mockGroups = [{ id: 'group-1', name: 'test-group' }];
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGroups) });
      const result = await (await import('../../src/logic.service')).fetchUserGroupDetails(mockToken, 'test-group');
      expect(result).toEqual(mockGroups);
    });

    it('fetchUserGroupDetails handles error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      try {
        await (await import('../../src/logic.service')).fetchUserGroupDetails(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('fetchSubGroups returns subgroups', async () => {
      const mockSubGroups = [{ id: 'subgroup-1', name: 'subgroup' }];
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSubGroups) });
      const result = await (await import('../../src/logic.service')).fetchSubGroups(mockToken, 'group-1');
      expect(result).toEqual(mockSubGroups);
    });

    it('fetchSubGroups handles error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      try {
        await (await import('../../src/logic.service')).fetchSubGroups(mockToken, 'group-1');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('fetchGroupMembers returns members', async () => {
      const mockMembers = [{ id: 'user-1', username: 'testuser' }];
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockMembers) });
      const result = await (await import('../../src/logic.service')).fetchGroupMembers(mockToken, 'subgroup-1');
      expect(result).toEqual(mockMembers);
    });

    it('fetchGroupMembers handles error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      try {
        await (await import('../../src/logic.service')).fetchGroupMembers(mockToken, 'subgroup-1');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect(err).toEqual(new Error('Network error'));
      }
    });

    it('fetchUserGroupDetails covers finally block', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await (await import('../../src/logic.service')).fetchUserGroupDetails(mockToken, 'test-group');
      // No assertion needed, just coverage for finally
    });

    it('fetchSubGroups covers finally block', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await (await import('../../src/logic.service')).fetchSubGroups(mockToken, 'group-1');
    });

    it('fetchGroupMembers covers finally block', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
      await (await import('../../src/logic.service')).fetchGroupMembers(mockToken, 'subgroup-1');
    });

    it('fetchUserGroupDetails handles missing env variables', async () => {
      const originalAuthUrl = process.env.AUTH_URL;
      const originalRealm = process.env.KEYCLOAK_REALM;
      try {
        delete process.env.AUTH_URL;
        delete process.env.KEYCLOAK_REALM;
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
        await (await import('../../src/logic.service')).fetchUserGroupDetails(mockToken, 'test-group');
      } finally {
        process.env.AUTH_URL = originalAuthUrl;
        process.env.KEYCLOAK_REALM = originalRealm;
      }
    });

    it('fetchSubGroups handles missing env variables', async () => {
      const originalAuthUrl = process.env.AUTH_URL;
      const originalRealm = process.env.KEYCLOAK_REALM;
      try {
        delete process.env.AUTH_URL;
        delete process.env.KEYCLOAK_REALM;
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
        await (await import('../../src/logic.service')).fetchSubGroups(mockToken, 'group-1');
      } finally {
        process.env.AUTH_URL = originalAuthUrl;
        process.env.KEYCLOAK_REALM = originalRealm;
      }
    });

    it('fetchGroupMembers handles missing env variables', async () => {
      const originalAuthUrl = process.env.AUTH_URL;
      const originalRealm = process.env.KEYCLOAK_REALM;
      try {
        delete process.env.AUTH_URL;
        delete process.env.KEYCLOAK_REALM;
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
        await (await import('../../src/logic.service')).fetchGroupMembers(mockToken, 'subgroup-1');
      } finally {
        process.env.AUTH_URL = originalAuthUrl;
        process.env.KEYCLOAK_REALM = originalRealm;
      }
    });

    it('fetchUserGroupDetails handles HTTP error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({}),
      });

      try {
        await (await import('../../src/logic.service')).fetchUserGroupDetails(mockToken, 'test-group');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect((err as Error).message).toBe('Keycloak API error: 401 Unauthorized');
      }
    });

    it('fetchSubGroups handles HTTP error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({}),
      });

      try {
        await (await import('../../src/logic.service')).fetchSubGroups(mockToken, 'group-1');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect((err as Error).message).toBe('Keycloak API error: 403 Forbidden');
      }
    });

    it('fetchGroupMembers handles HTTP error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({}),
      });

      try {
        await (await import('../../src/logic.service')).fetchGroupMembers(mockToken, 'subgroup-1');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect((err as Error).message).toBe('Keycloak API error: 404 Not Found');
      }
    });
  });
});
