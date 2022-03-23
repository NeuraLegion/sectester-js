import { Configuration } from './Configuration';
import container from './container';
import { EnvCredentialProvider } from './DefaultCredentialProvider';
import { env } from 'process';

describe('configuration', () => {
  const testApi = 'test/api';
  const testBus = 'test-bus';
  const testToken = 'test-token';
  let configuration: Configuration;

  beforeAll(() => {
    const credentialProvider = container.resolve(EnvCredentialProvider);

    configuration = new Configuration({
      api: testApi,
      bus: testBus,
      credentials: {
        token: testToken
      },
      credentialProviders: [credentialProvider]
    });
  });

  it('should be a single instance', () => {
    const configuration2 = container.resolve(Configuration);
    expect(configuration).toBe(configuration2);
  });

  describe('get', () => {
    it('should get api', () => {
      const api = configuration.get('api');
      expect(testApi).toEqual(api);
    });

    it('should get bus', () => {
      const bus = configuration.get('bus');
      expect(testBus).toEqual(bus);
    });

    it('should get credentials', () => {
      const token = configuration.get('credentials')?.token;
      expect(testToken).toEqual(token);
    });
  });

  describe('loadCredentials', () => {
    it('should load credentials from provider', async () => {
      const providerToken = 'test-provider-token';
      (env as any).BRIGHT_TOKEN = providerToken;
      await configuration.loadCredentials();
      const token = configuration.get('credentials')?.token;

      expect(providerToken).toEqual(token);
    });
  });
});
