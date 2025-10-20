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
        expect(err).toEqual(new Error('getTazamaToken retrieval failed'));
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
        expect(err).toEqual(new Error('getTazamaToken retrieval failed'));
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
  });
});
