import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider } from '../credentials-provider';
import { instance, mock, reset, verify, when } from 'ts-mockito';

describe('configuration', () => {
  const mockedProvider = mock<EnvCredentialProvider>();

  afterEach(() => reset(mockedProvider));

  describe('constructor', () => {
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
      const configuration = new Configuration({
        cluster: 'app.neuralegion.com',
        credentialProviders: [instance(mockedProvider)]
      });

      when(mockedProvider.get()).thenResolve(mockedCredentials);

      await configuration.loadCredentials();

      verify(mockedProvider.get()).once();
      expect(configuration).toMatchObject({ credentials: mockedCredentials });
    });
  });
});