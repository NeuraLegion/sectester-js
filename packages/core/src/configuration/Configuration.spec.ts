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

    it('should throw if cluster is not passed', () => {
      expect(
        () =>
          new Configuration({
            cluster: '',
            credentials: {
              token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
            }
          })
      ).toThrow();
    });

    it('should throw an error if credentials or credential providers are not passed', () => {
      expect(
        () =>
          new Configuration({
            cluster: 'example.com'
          })
      ).toThrow();
    });

    it.each([
      {
        input: 'localhost',
        expected: { bus: 'amqp://localhost:5672', api: 'http://localhost:8000' }
      },
      {
        input: 'localhost:8080',
        expected: { bus: 'amqp://localhost:5672', api: 'http://localhost:8000' }
      },
      {
        input: 'http://localhost',
        expected: { bus: 'amqp://localhost:5672', api: 'http://localhost:8000' }
      },
      {
        input: 'http://localhost:8080',
        expected: { bus: 'amqp://localhost:5672', api: 'http://localhost:8000' }
      },
      {
        input: '127.0.0.1',
        expected: { bus: 'amqp://127.0.0.1:5672', api: 'http://127.0.0.1:8000' }
      },
      {
        input: '127.0.0.1:8080',
        expected: { bus: 'amqp://127.0.0.1:5672', api: 'http://127.0.0.1:8000' }
      },
      {
        input: 'http://127.0.0.1',
        expected: { bus: 'amqp://127.0.0.1:5672', api: 'http://127.0.0.1:8000' }
      },
      {
        input: 'http://127.0.0.1:8080',
        expected: { bus: 'amqp://127.0.0.1:5672', api: 'http://127.0.0.1:8000' }
      },
      {
        input: 'example.com',
        expected: {
          bus: 'amqps://amq.example.com:5672',
          api: 'https://example.com'
        }
      },
      {
        input: 'example.com:443',
        expected: {
          bus: 'amqps://amq.example.com:5672',
          api: 'https://example.com'
        }
      },
      {
        input: 'http://example.com',
        expected: {
          bus: 'amqps://amq.example.com:5672',
          api: 'https://example.com'
        }
      },
      {
        input: 'http://example.com:443',
        expected: {
          bus: 'amqps://amq.example.com:5672',
          api: 'https://example.com'
        }
      }
    ])('should generate correct api and bus for $input', entry => {
      const configuration = new Configuration({
        cluster: entry.input,
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual(entry.expected.bus);
      expect(configuration.api).toEqual(entry.expected.api);
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

    it('should load credentials from profider', async () => {
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
