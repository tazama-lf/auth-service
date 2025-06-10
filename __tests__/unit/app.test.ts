import { getTazamaToken } from '../../src/logic.service';

// TazamaAuthentication mocked in jest.setup.ts

describe('App Services', () => {
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
