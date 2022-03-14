import { Configuration, container } from '../src/configuration';
import { DefaultCredentialProvider } from '../src/configuration/DefaultCredentialProvider';
import { env } from 'process';

describe('configuration', () => {
  const testApi = 'test/api';
  const testBus = 'test-bus';
  const testToken = 'test-token';
  const credentialProvider = container.resolve(DefaultCredentialProvider);

  const configuration = Configuration.create({
    api: testApi,
    bus: testBus,
    credentials: {
      token: testToken
    },
    credentialProviders: [credentialProvider]
  });

  it('Configuration is single instance', () => {
    const configuration2 = container.resolve(typeof Configuration);
    expect(configuration).toBe(configuration2);
  });

  it('Can get api', () => {
    const api = configuration.get('api');
    expect(testApi).toEqual(api);
  });

  it('Can get bus', () => {
    const bus = configuration.get('bus');
    expect(testBus).toEqual(bus);
  });

  it('Can get credentials', () => {
    const token = configuration.get('credentials')?.token;

    expect(testToken).toEqual(token);
  });

  it('Can get credentials from provider', async () => {
    const providerToken = 'test-provider-token';
    (env as any).BRIGHT_TOKEN = providerToken;
    await configuration.loadCredentials();
    const token = configuration.get('credentials')?.token;

    expect(providerToken).toEqual(token);
  });
});
