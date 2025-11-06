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
    logLevel: '',
  }),
}));
