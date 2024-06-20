import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider } from '../credentials-provider';
import { instance, mock, reset, verify, when } from 'ts-mockito';
import { resolve } from 'path';

describe('Configuration', () => {
  const mockedProvider = mock<EnvCredentialProvider>();

  afterEach(() => reset(mockedProvider));

  describe('constructor', () => {
    it('should be a single instance', () => {
      const configuration = new Configuration({
        hostname: 'example.com'
      });
      const configuration2 = configuration.container.resolve(Configuration);
      expect(configuration).toBe(configuration2);
    });

    it('should throw if hostname is not passed', () =>
      expect(
        () =>
          new Configuration({
            hostname: ''
          })
      ).toThrow());

    it('should throw an error if credentials or credential providers are not passed', () =>
      expect(
        () =>
          new Configuration({
            hostname: 'example.com',
            credentialProviders: []
          })
      ).toThrow());

    it('should return an expected name', () => {
      const configuration = new Configuration({
        hostname: 'example.com'
      });
      const pathToRootPackageJson = resolve(
        __dirname,
        '../../../../package.json'
      );
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { name } = require(pathToRootPackageJson);

      const result = configuration.name;

      expect(result).toBe(name);
    });

    it('should return an expected version', () => {
      const configuration = new Configuration({
        hostname: 'example.com'
      });
      const pathToPackageJson = resolve(__dirname, '../../package.json');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { version } = require(pathToPackageJson);

      const result = configuration.version;

      expect(result).toBe(version);
    });

    it('should return an expected repeater version', () => {
      const configuration = new Configuration({
        hostname: 'example.com'
      });
      const pathToPackageJson = resolve(__dirname, '../../package.json');
      const {
        secTester: { repeaterVersion }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
      } = require(pathToPackageJson);

      const result = configuration.repeaterVersion;

      expect(result).toBe(repeaterVersion);
    });

    it('should use options with default values', () => {
      const config = new Configuration({
        hostname: 'example.com'
      });

      expect(config).toMatchObject({
        credentialProviders: expect.arrayContaining([
          expect.any(EnvCredentialProvider)
        ])
      });
    });

    it.each([
      {
        input: 'localhost',
        expected: { api: 'http://localhost:8000' }
      },
      {
        input: 'localhost:8080',
        expected: { api: 'http://localhost:8000' }
      },
      {
        input: 'http://localhost',
        expected: { api: 'http://localhost:8000' }
      },
      {
        input: 'http://localhost:8080',
        expected: { api: 'http://localhost:8000' }
      },
      {
        input: '127.0.0.1',
        expected: { api: 'http://127.0.0.1:8000' }
      },
      {
        input: '127.0.0.1:8080',
        expected: { api: 'http://127.0.0.1:8000' }
      },
      {
        input: 'http://127.0.0.1',
        expected: { api: 'http://127.0.0.1:8000' }
      },
      {
        input: 'http://127.0.0.1:8080',
        expected: { api: 'http://127.0.0.1:8000' }
      },
      {
        input: 'example.com',
        expected: {
          api: 'https://example.com'
        }
      },
      {
        input: 'example.com:443',
        expected: {
          api: 'https://example.com'
        }
      },
      {
        input: 'http://example.com',
        expected: {
          api: 'https://example.com'
        }
      },
      {
        input: 'http://example.com:443',
        expected: {
          api: 'https://example.com'
        }
      }
    ])(
      'should generate correct api and bus for $input',
      ({ expected, input }) => {
        const configuration = new Configuration({
          hostname: input
        });

        expect(configuration).toMatchObject(expected);
      }
    );

    it('should throw an error if hostname is wrong', () => {
      expect(
        () =>
          new Configuration({
            hostname: ':test'
          })
      ).toThrow("pass correct 'hostname' option");
    });
  });

  describe('loadCredentials', () => {
    it('should do nothing if provider not defined', async () => {
      const credentials = {
        token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0'
      };
      const configuration = new Configuration({
        credentials,
        hostname: 'app.neuralegion.com'
      });

      await configuration.loadCredentials();

      expect(configuration).toMatchObject({ credentials });
    });

    it('should load credentials using a provider', async () => {
      const credentials = {
        token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0'
      };
      const configuration = new Configuration({
        hostname: 'app.neuralegion.com',
        credentialProviders: [instance(mockedProvider)]
      });
      when(mockedProvider.get()).thenResolve(credentials);

      await configuration.loadCredentials();

      verify(mockedProvider.get()).once();
      expect(configuration).toMatchObject({ credentials });
    });

    it('should throw an error if no one provider does not find credentials', async () => {
      const configuration = new Configuration({
        hostname: 'app.neuralegion.com',
        credentialProviders: [instance(mockedProvider)]
      });
      when(mockedProvider.get()).thenResolve(undefined);

      const result = configuration.loadCredentials();

      await expect(result).rejects.toThrow('Could not load credentials');
    });
  });
});
