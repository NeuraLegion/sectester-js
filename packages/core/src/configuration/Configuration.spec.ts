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

    it('should throw if credentials or credentialProviders are not passed', () => {
      expect(
        () =>
          new Configuration({
            cluster: 'example.com'
          })
      ).toThrow();
    });

    it('should generate correct api and bus for localhost', () => {
      const configuration = new Configuration({
        cluster: 'localhost',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://localhost:5672');
      expect(configuration.api).toEqual('http://localhost:8000');
    });

    it('should generate correct api and bus for localhost:{port}', () => {
      const configuration = new Configuration({
        cluster: 'localhost:8080',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://localhost:5672');
      expect(configuration.api).toEqual('http://localhost:8000');
    });

    it('should generate correct api and bus for 127.0.0.1', () => {
      const configuration = new Configuration({
        cluster: '127.0.0.1',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://127.0.0.1:5672');
      expect(configuration.api).toEqual('http://127.0.0.1:8000');
    });

    it('should generate correct api and bus for 127.0.0.1:{port}', () => {
      const configuration = new Configuration({
        cluster: '127.0.0.1:8080',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://127.0.0.1:5672');
      expect(configuration.api).toEqual('http://127.0.0.1:8000');
    });

    it('should generate correct api and bus for http://localhost', () => {
      const configuration = new Configuration({
        cluster: 'localhost',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://localhost:5672');
      expect(configuration.api).toEqual('http://localhost:8000');
    });

    it('should generate correct api and bus for http://localhost:{port}', () => {
      const configuration = new Configuration({
        cluster: 'localhost:8080',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://localhost:5672');
      expect(configuration.api).toEqual('http://localhost:8000');
    });

    it('should generate correct api and bus for http://127.0.0.1', () => {
      const configuration = new Configuration({
        cluster: '127.0.0.1',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://127.0.0.1:5672');
      expect(configuration.api).toEqual('http://127.0.0.1:8000');
    });

    it('should generate correct api and bus for http://127.0.0.1:{port}', () => {
      const configuration = new Configuration({
        cluster: '127.0.0.1:8080',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqp://127.0.0.1:5672');
      expect(configuration.api).toEqual('http://127.0.0.1:8000');
    });

    it('should generate correct api and bus for example.com', () => {
      const configuration = new Configuration({
        cluster: 'example.com',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqps://amq.example.com:5672');
      expect(configuration.api).toEqual('https://example.com');
    });

    it('should generate correct api and bus for example.com:443', () => {
      const configuration = new Configuration({
        cluster: 'example.com:443',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqps://amq.example.com:5672');
      expect(configuration.api).toEqual('https://example.com');
    });

    it('should generate correct api and bus for https://example.com', () => {
      const configuration = new Configuration({
        cluster: 'https://example.com',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqps://amq.example.com:5672');
      expect(configuration.api).toEqual('https://example.com');
    });

    it('should generate correct api and bus for https://example.com:443', () => {
      const configuration = new Configuration({
        cluster: 'https://example.com:443',
        credentials: {
          token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        }
      });

      expect(configuration.bus).toEqual('amqps://amq.example.com:5672');
      expect(configuration.api).toEqual('https://example.com');
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
