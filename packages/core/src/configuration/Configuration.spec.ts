import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider } from '../credentials-provider';
import { instance, mock, reset, verify, when } from 'ts-mockito';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

describe('Configuration', () => {
  const mockedProvider = mock<EnvCredentialProvider>();

  afterEach(() => reset(mockedProvider));

  describe('constructor', () => {
    it('should be a single instance', () => {
      const configuration = new Configuration({
        hostname: 'example.com',
        projectId: randomUUID()
      });
      const configuration2 = configuration.container.resolve(Configuration);
      expect(configuration).toBe(configuration2);
    });

    it('should throw if hostname is not passed', () =>
      expect(
        () =>
          new Configuration({
            hostname: '',
            projectId: randomUUID()
          })
      ).toThrow());

    it('should throw if projectId is not passed', () =>
      expect(
        () =>
          new Configuration({
            hostname: 'example.com',
            projectId: ''
          })
      ).toThrow());

    it('should throw an error if credentials or credential providers are not passed', () =>
      expect(
        () =>
          new Configuration({
            hostname: 'example.com',
            credentialProviders: [],
            projectId: randomUUID()
          })
      ).toThrow());

    it('should return an expected name', () => {
      const configuration = new Configuration({
        hostname: 'example.com',
        projectId: randomUUID()
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
        hostname: 'example.com',
        projectId: randomUUID()
      });
      const pathToPackageJson = resolve(__dirname, '../../package.json');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { version } = require(pathToPackageJson);

      const result = configuration.version;

      expect(result).toBe(version);
    });

    it('should use options with default values', () => {
      const config = new Configuration({
        hostname: 'example.com',
        projectId: randomUUID()
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
        expected: { baseURL: 'http://localhost:8000' }
      },
      {
        input: 'localhost:8080',
        expected: { baseURL: 'http://localhost:8000' }
      },
      {
        input: 'http://localhost',
        expected: { baseURL: 'http://localhost:8000' }
      },
      {
        input: 'http://localhost:8080',
        expected: { baseURL: 'http://localhost:8000' }
      },
      {
        input: '127.0.0.1',
        expected: { baseURL: 'http://127.0.0.1:8000' }
      },
      {
        input: '127.0.0.1:8080',
        expected: { baseURL: 'http://127.0.0.1:8000' }
      },
      {
        input: 'http://127.0.0.1',
        expected: { baseURL: 'http://127.0.0.1:8000' }
      },
      {
        input: 'http://127.0.0.1:8080',
        expected: { baseURL: 'http://127.0.0.1:8000' }
      },
      {
        input: 'example.com',
        expected: {
          baseURL: 'https://example.com'
        }
      },
      {
        input: 'example.com:443',
        expected: {
          baseURL: 'https://example.com'
        }
      },
      {
        input: 'http://example.com',
        expected: {
          baseURL: 'https://example.com'
        }
      },
      {
        input: 'http://example.com:443',
        expected: {
          baseURL: 'https://example.com'
        }
      }
    ])('should generate correct base URL for $input', ({ expected, input }) => {
      const configuration = new Configuration({
        hostname: input,
        projectId: randomUUID()
      });

      expect(configuration).toMatchObject(expected);
    });

    it('should throw an error if hostname is wrong', () => {
      expect(
        () =>
          new Configuration({
            hostname: ':test',
            projectId: randomUUID()
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
        projectId: randomUUID(),
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
        projectId: randomUUID(),
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
        projectId: randomUUID(),
        credentialProviders: [instance(mockedProvider)]
      });
      when(mockedProvider.get()).thenResolve(undefined);

      const result = configuration.loadCredentials();

      await expect(result).rejects.toThrow('Could not load credentials');
    });
  });
});
