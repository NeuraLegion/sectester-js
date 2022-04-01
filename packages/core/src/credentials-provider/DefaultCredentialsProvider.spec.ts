import { CredentialProvider } from './CredentialsProvider';
import { EnvCredentialProvider } from './DefaultCredentialsProvider';
import { reset, spy, when } from 'ts-mockito';

describe('EnvCredentialProvider', () => {
  describe('get', () => {
    const spiedEnv = spy(process.env);
    let provider!: CredentialProvider;

    beforeEach(() => {
      provider = new EnvCredentialProvider();
    });

    afterEach(() => reset(spiedEnv));

    it('should return undefined if credentials in not provided', async () => {
      const token = (await provider.get())?.token;

      expect(token).toBeUndefined();
    });

    it('should return credentials from environment', async () => {
      const testToken = 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      when(spiedEnv['BRIGHT_TOKEN']).thenReturn(testToken);

      const token = (await provider.get())?.token;

      expect(token).toEqual(testToken);
    });
  });
});
