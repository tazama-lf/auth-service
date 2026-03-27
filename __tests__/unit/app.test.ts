import { getTazamaToken, fetchUsersByRole } from '../../src/logic.service';
import { authService } from '../../src/index';
import type { TazamaUser } from '@tazama-lf/auth-lib';

// TazamaAuthentication mocked in jest.setup.ts

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

    it('should return users when authService resolves', async () => {
      const mockUsers: TazamaUser[] = [{ id: 'user-1', username: 'testuser' } as TazamaUser];
      (authService.fetchUsersByRole as jest.Mock).mockResolvedValueOnce(mockUsers);

      const result = await fetchUsersByRole(mockToken, 'test-group', 'admin-role');

      expect(result).toEqual(mockUsers);
      expect(authService.fetchUsersByRole).toHaveBeenCalledWith(mockToken, 'test-group', 'admin-role');
    });

    it('should re-throw error from authService', async () => {
      (authService.fetchUsersByRole as jest.Mock).mockRejectedValueOnce(new Error('getUsersByRole retrieval failed'));

      try {
        await fetchUsersByRole(mockToken, 'test-group', 'admin-role');
        throw new Error('UNREACHABLE');
      } catch (err) {
        expect((err as Error).message).toBe('getUsersByRole retrieval failed');
      }
    });
  });
});
