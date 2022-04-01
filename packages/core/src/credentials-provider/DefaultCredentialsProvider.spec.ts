import { CredentialProvider } from './CredentialsProvider';
import { EnvCredentialProvider } from './DefaultCredentialProvider';

describe('EnvCredentialProvider', () => {
  describe('get', () => {
    const OLD_ENV = process.env;
    let provider: CredentialProvider;

    beforeAll(() => {
      provider = new EnvCredentialProvider();
    });

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should return undefuned if credentials in nit set', async () => {
      const token = (await provider.get())?.token;

      expect(token).toBeUndefined();
    });

    it('should return credentials from environment', async () => {
      const testToken = 'test-token';
      (process.env as any).BRIGHT_TOKEN = testToken;

      const token = (await provider.get())?.token;

      expect(token).toEqual(testToken);
    });
  });
});
