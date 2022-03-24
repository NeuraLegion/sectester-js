import 'reflect-metadata';

import { Configuration } from './Configuration';
import { EnvCredentialProvider } from './DefaultCredentialProvider';
import { Credentials } from './CredentialsProvider';
import { instance, mock, when } from 'ts-mockito';

describe('configuration', () => {
  const testApi = 'test/api';
  const testBus = 'test-bus';
  const testToken = 'test-token';
  const providerToken = 'test-provider-token';
  let configuration: Configuration;
  let credentialProvider: EnvCredentialProvider;

  beforeAll(() => {
    const mockedProvider = mock(EnvCredentialProvider);
    when(mockedProvider.get()).thenResolve({
      token: providerToken
    } as Credentials);
    credentialProvider = instance(mockedProvider);

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
    const configuration2 = configuration.container.resolve(Configuration);
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
    it('provider function should be callsed', async () => {
      const spyGet = jest.spyOn(credentialProvider, 'get');
      await configuration.loadCredentials();
      expect(spyGet).toHaveBeenCalled();
    });

    it('credentials from provider should be correct', () => {
      const token = configuration.get('credentials')?.token;
      expect(providerToken).toEqual(token);
    });
  });
});
