import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider } from '../credentials-provider';
import { instance, mock, reset, verify, when } from 'ts-mockito';

describe('configuration', () => {
  const mockedProvider = mock<EnvCredentialProvider>();

  afterEach(() => {
    reset(mockedProvider);
  });

  it('should be a single instance', () => {
    const configuration = new Configuration({
      cluster: 'app.neuralegion.com',
      credentials: {
        token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      }
    });
    const configuration2 = configuration.container.resolve(Configuration);
    expect(configuration).toBe(configuration2);
  });

  describe('loadCredentials', () => {
    it('should not throw if provider not defined', async () => {
      const configuration = new Configuration({
        cluster: 'app.neuralegion.com',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });
      await expect(configuration.loadCredentials()).resolves.not.toThrow();
    });

    it('Should load credentials from profider', async () => {
      const mockedCredentials = {
        token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      };
      const credentialProvider = instance(mockedProvider);
      const configuration = new Configuration({
        cluster: 'app.neuralegion.com',
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
