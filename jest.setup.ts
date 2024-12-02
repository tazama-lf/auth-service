const authLib = jest.requireActual('@frmscoe/auth-lib');

class MockAuthenticationService {
  getToken(u: string, p: string): Promise<string> {
    if (u === 'blank') {
      return Promise.resolve('');
    } else if (u === 'reject') {
      return Promise.reject('REJECT');
    } else {
      return Promise.resolve(`${u}${p}`);
    }
  }
}

const mockedAuthLib = { ...authLib, AuthenticationService: MockAuthenticationService };

jest.mock('@frmscoe/auth-lib', () => mockedAuthLib);

jest.mock('@tazama-lf/frms-coe-lib/lib/config', () => ({
  validateEnvVar: jest.fn().mockReturnValue(''),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/config', () => ({
  validateEnvVar: jest.fn().mockReturnValue(''),
  validateProcessorConfig: jest.fn().mockReturnValue({
    maxCPU: 1,
    functionName: 'auth-test',
    nodeEnv: 'test'
  }),
  validateLogConfig: jest.fn().mockReturnValue({
    logstashLevel: '',
  }),
}));
