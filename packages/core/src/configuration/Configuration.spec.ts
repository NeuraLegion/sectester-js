import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider, Credentials } from '../credentials-provider';
import { instance, mock, when } from 'ts-mockito';

describe('configuration', () => {
  describe('instance', () => {
    let configuration!: Configuration;

    beforeAll(() => {
      configuration = new Configuration({});
    });

    it('should be a single instance', () => {
      const configuration2 = configuration.container.resolve(Configuration);
      expect(configuration).toBe(configuration2);
    });
  });

  describe('options', () => {
    let configuration: Configuration;

    beforeAll(() => {
      configuration = new Configuration({
        api: 'test/api',
        bus: 'test-bus',
        credentials: {
          token: 'test-token'
        }
      });
    });

    it('bus should be defined', () => {
      expect(configuration.options.api).toBeDefined();
    });

    it('url should be defined', () => {
      expect(configuration.options.bus).toBeDefined();
    });

    describe('credentials', () => {
      it('should be defined', () => {
        expect(configuration.options.credentials).toBeDefined();
      });
    });
  });

  describe('undefined options', () => {
    let configuration: Configuration;

    beforeAll(() => {
      configuration = new Configuration({});
    });

    it('bus should be undefined', () => {
      expect(configuration.options.api).toBeUndefined();
    });

    it('url should be undefined', () => {
      expect(configuration.options.bus).toBeUndefined();
    });

    describe('credentials', () => {
      it('should be undefined', () => {
        expect(configuration.options.credentials).toBeUndefined();
      });
    });
  });

  describe('loadCredentials', () => {
    const providerToken = 'test-provider-token';
    let credentialProvider!: EnvCredentialProvider;
    let configuration!: Configuration;

    beforeEach(() => {
      const mockedProvider = mock<EnvCredentialProvider>();
      when(mockedProvider.get()).thenResolve({
        token: providerToken
      } as Credentials);
      credentialProvider = instance(mockedProvider);

      configuration = new Configuration({
        credentialProviders: [credentialProvider]
      });
    });

    it('beafor call credentials should be undefined', () => {
      expect(configuration.options.credentials).toBeUndefined();
    });

    it('provider function should be callsed', async () => {
      const spyGet = jest.spyOn(credentialProvider, 'get');
      await configuration.loadCredentials();
      expect(spyGet).toHaveBeenCalled();
    });

    it('credentials from provider should be correct', async () => {
      await configuration.loadCredentials();
      const token = configuration.options.credentials?.token;
      expect(providerToken).toEqual(token);
    });
  });
});
