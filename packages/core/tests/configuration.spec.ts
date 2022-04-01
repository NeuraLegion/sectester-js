import { Configuration, container } from '../src/configuration';
import { DefaultCredentialProvider } from '../src/configuration/DefaultCredentialProvider';
import { env } from 'process';

describe('configuration', () => {
  it('Configuration is single instance', () => {
    const configuration = new Configuration({});

    const configuration2 = container.resolve(Configuration);
    expect(configuration).toBe(configuration2);
  });

  it('Can get api', () => {
    const testApi = 'test/api';
    const configuration = new Configuration({
      api: testApi
    });

    const api = configuration.get('api');

    expect(testApi).toEqual(api);
  });

  it('Can get bus', () => {
    const testBus = 'test-bus';
    const configuration = new Configuration({
      bus: testBus
    });

    const bus = configuration.get('bus');

    expect(testBus).toEqual(bus);
  });

  it('Can get credentials', () => {
    const testToken = 'test-token';
    const configuration = new Configuration({
      credentials: {
        token: testToken
      }
    });

    const token = configuration.get('credentials')?.token;

    expect(testToken).toEqual(token);
  });

  it('Can get credentials from provider', async () => {
    const testToken = 'test-token';
    (env as any).BRIGHT_TOKEN = testToken;
    const credentialProvider = container.resolve(DefaultCredentialProvider);

    const configuration = new Configuration({
      credentialProviders: [credentialProvider]
    });

    await configuration.loadCredentials();

    const token = configuration.get('credentials')?.token;

    expect(testToken).toEqual(token);
  });
});
