import { CredentialProvider } from './CredentialsProvider';
import { EnvCredentialProvider } from './EnvCredentialProvider';
import { reset, spy, when } from 'ts-mockito';

describe('EnvCredentialProvider', () => {
  const processEnv = process.env;
  let processSpy!: NodeJS.Process;
  let provider!: CredentialProvider;

  beforeEach(() => {
    processSpy = spy(process);
    provider = new EnvCredentialProvider();
  });

  afterEach(() => reset(processSpy));

  describe('get', () => {
    it('should return undefined if credentials in not provided', async () => {
      const result = await provider.get();

      expect(result).toBeUndefined();
    });

    it('should return credentials from environment', async () => {
      const token = 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0';

      when(processSpy.env).thenReturn({
        ...processEnv,
        BRIGHT_TOKEN: token
      });

      const result = await provider.get();

      expect(result).toEqual({ token });
    });
  });
});
