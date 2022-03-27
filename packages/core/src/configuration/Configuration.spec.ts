import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider } from '../credentials-provider';
import { instance, mock, reset, verify, when } from 'ts-mockito';

describe('configuration', () => {
  it('should be a single instance', () => {
    const configuration = new Configuration({});
    const configuration2 = configuration.container.resolve(Configuration);
    expect(configuration).toBe(configuration2);
  });

  describe('loadCredentials', () => {
    let mockedProvider!: EnvCredentialProvider;

    beforeEach(() => {
      mockedProvider = mock<EnvCredentialProvider>();
    });

    afterEach(() => {
      reset(mockedProvider);
    });

    it('should not throw if provider not defined', async () => {
      const configuration = new Configuration({});
      await expect(configuration.loadCredentials()).resolves.not.toThrow();
    });

    it('Should load credentials from profider', async () => {
      const mockedCredentials = {
        token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      };
      const credentialProvider = instance(mockedProvider);
      const configuration = new Configuration({
        credentialProviders: [credentialProvider]
      });

      when(mockedProvider.get()).thenResolve(mockedCredentials);

      await configuration.loadCredentials();
      const credentials = configuration.credentials;

      verify(mockedProvider.get()).once();
      expect(credentials).toBe(mockedCredentials);
    });
  });
});
