// Set mock Keycloak environment variables for testing
process.env.AUTH_URL = 'http://localhost:8080';
process.env.KEYCLOAK_REALM = 'test-realm';
process.env.CLIENT_ID = 'test-client';
process.env.CLIENT_SECRET = 'test-secret';

import type { TazamaAuthentication, TazamaToken, TazamaUser } from '@tazama-lf/auth-lib';

const authLib = jest.requireActual('@tazama-lf/auth-lib');
class MockAuthenticationService extends (authLib.TazamaAuthentication as typeof TazamaAuthentication) {
  getToken(...args: unknown[]): Promise<string> {
    if (!args || args[0] === 'blank') {
      return Promise.resolve('');
    } else if (args[0] === 'reject') {
      return Promise.reject('REJECT');
    } else {
      return Promise.resolve(`${args[0]}`);
    }
  }

  // Override to delegate to actual provider implementation
  async fetchUsersByRole(token: TazamaToken, groupName: string, roleName: string): Promise<TazamaUser[]> {
    const self = this as any;
    if (!self.activeInstance) {
      const { KeycloakProvider } = await import('@tazama-lf/auth-lib-provider-keycloak/lib/provider');
      const provider = new KeycloakProvider();
      self.providerInstances.set('test-provider', provider);
      self.activeInstance = 'test-provider';
    }

    return await super.fetchUsersByRole(token, groupName, roleName);
  }
}

const mockedAuthLib = { ...authLib, TazamaAuthentication: MockAuthenticationService };

jest.mock('@tazama-lf/auth-lib', () => {
  return mockedAuthLib;
});

jest.mock('@tazama-lf/frms-coe-lib/lib/config', () => ({
  validateEnvVar: jest.fn().mockReturnValue(''),
  validateProcessorConfig: jest.fn().mockReturnValue({
    maxCPU: 1,
    functionName: 'auth-test',
    nodeEnv: 'test',
  }),
  validateLogConfig: jest.fn().mockReturnValue({
    logLevel: 'info',
  }),
}));

// Mock LoggerService to prevent initialization errors
jest.mock('@tazama-lf/frms-coe-lib', () => ({
  LoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
  })),
  validateEnvVar: jest.fn().mockReturnValue(''),
}));
