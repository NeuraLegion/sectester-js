import { CredentialProvider } from './CredentialsProvider';
import { EnvCredentialProvider } from './EnvCredentialProvider';
import { reset, spy, when } from 'ts-mockito';

describe('EnvCredentialProvider', () => {
  const spiedEnv = spy(process.env);
  let provider!: CredentialProvider;

  beforeEach(() => {
    provider = new EnvCredentialProvider();
  });

  afterEach(() => reset(spiedEnv));

  describe('get', () => {
    it('should return undefined if credentials in not provided', async () => {
      const result = await provider.get();

      expect(result).toBeUndefined();
    });

    it('should return credentials from environment', async () => {
      const token = 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0';
      when(spiedEnv.BRIGHT_TOKEN).thenReturn(token);

      const result = await provider.get();

      expect(result).toEqual({ token });
    });
  });
});
