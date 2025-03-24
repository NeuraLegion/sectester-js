import 'reflect-metadata';
import { Configuration } from './Configuration';
import { EnvCredentialProvider } from '../credentials-provider';
import { Projects } from '../Projects';
import { instance, mock, reset, verify, when } from 'ts-mockito';
import { container } from 'tsyringe';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

describe('Configuration', () => {
  const projectId = randomUUID();
  const hostname = 'example.com';
  const mockedEnvCredentialProvider = mock<EnvCredentialProvider>();
  const mockedProjects = mock<Projects>();

  beforeEach(() => {
    container.clearInstances();

    container.register(Projects, { useValue: instance(mockedProjects) });
  });

  afterEach(() => {
    container.clearInstances();
    reset<EnvCredentialProvider | Projects>(
      mockedEnvCredentialProvider,
      mockedProjects
    );
  });

  describe('constructor', () => {
    it('should be a single instance', () => {
      const configuration = new Configuration({
        hostname,
        projectId
      });
      const configuration2 = configuration.container.resolve(Configuration);
      expect(configuration).toBe(configuration2);
    });

    it('should throw if empty hostname is passed', () =>
      expect(
        () =>
          new Configuration({
            hostname: ''
          })
      ).toThrow("Please make sure that you pass correct 'hostname' option."));

    it('should throw an error if credentials or credential providers are not passed', () =>
      expect(
        () =>
          new Configuration({
            hostname,
            credentialProviders: []
          })
      ).toThrow());

    it('should return an expected name', () => {
      const configuration = new Configuration({
        hostname
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
        hostname
      });
      const pathToPackageJson = resolve(__dirname, '../../package.json');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { version } = require(pathToPackageJson);

      const result = configuration.version;

      expect(result).toBe(version);
    });

    it('should use options with default values', () => {
      const config = new Configuration({
        hostname
      });

      expect(config).toMatchObject({
        credentialProviders: expect.arrayContaining([
          expect.any(EnvCredentialProvider)
        ])
      });
    });

    it.each([
      {
        expected: { baseURL: 'https://app.brightsec.com' }
      },
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
        hostname: input
      });

      expect(configuration).toMatchObject(expected);
    });

    it('should use default hostname if not explicitly passed', () => {
      const configuration = new Configuration({});
      expect(configuration.baseURL).toBe('https://app.brightsec.com');
    });

    it('should throw an error if hostname is wrong', () => {
      expect(
        () =>
          new Configuration({
            hostname: ':test'
          })
      ).toThrow("pass correct 'hostname' option");
    });
  });

  describe('fetchProjectId', () => {
    it('should do nothing if projectId is defined', async () => {
      const configuration = new Configuration({
        projectId,
        hostname
      });

      await configuration.fetchProjectId();

      expect(configuration).toMatchObject({ projectId });
    });

    it('should fetch projectId if not defined', async () => {
      const configuration = new Configuration({
        hostname
      });

      when(mockedProjects.getDefaultProject()).thenResolve({
        id: projectId,
        name: 'test'
      });

      await configuration.fetchProjectId();

      expect(configuration).toMatchObject({ projectId });
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
        hostname: 'app.brightsec.com'
      });

      await configuration.loadCredentials();

      expect(configuration).toMatchObject({ credentials });
    });

    it('should load credentials using a provider', async () => {
      const credentials = {
        token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0'
      };
      const configuration = new Configuration({
        hostname: 'app.brightsec.com',
        projectId: randomUUID(),
        credentialProviders: [instance(mockedEnvCredentialProvider)]
      });
      when(mockedEnvCredentialProvider.get()).thenResolve(credentials);

      await configuration.loadCredentials();

      verify(mockedEnvCredentialProvider.get()).once();
      expect(configuration).toMatchObject({ credentials });
    });

    it('should throw an error if no one provider does not find credentials', async () => {
      const configuration = new Configuration({
        hostname: 'app.brightsec.com',
        projectId: randomUUID(),
        credentialProviders: [instance(mockedEnvCredentialProvider)]
      });
      when(mockedEnvCredentialProvider.get()).thenResolve(undefined);

      const result = configuration.loadCredentials();

      await expect(result).rejects.toThrow('Could not load credentials');
    });
  });
});
