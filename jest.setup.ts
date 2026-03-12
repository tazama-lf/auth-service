import type { TazamaAuthentication } from '@tazama-lf/auth-lib';

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
  async fetchUsersByRole(...args: unknown[]): Promise<unknown> {
    // Since tests mock the underlying fetch calls, we need to call the provider directly
    // Create a mock provider instance if needed
    const self = this as any;
    if (!self.activeInstance) {
      // Import KeycloakProvider dynamically to avoid circular dependency
      const { KeycloakProvider } = await import('@tazama-lf/auth-lib-provider-keycloak/lib/provider');
      // Manually set up a mock active instance for testing
      const provider = new KeycloakProvider();
      self.providerInstances.set('test-provider', provider);
      self.activeInstance = 'test-provider';
    }

    return await super.fetchUsersByRole(...args);
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
