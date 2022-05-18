import {
  CredentialProvider,
  Credentials,
  CredentialsOptions,
  EnvCredentialProvider
} from '../credentials-provider';
import { first } from '../utils';
import { LogLevel } from '../logger';
import { version, secTester } from '../../package.json';
import { container, injectable } from 'tsyringe';

export interface ConfigurationOptions {
  cluster: string;
  logLevel?: LogLevel;
  credentials?: Credentials | CredentialsOptions;
  credentialProviders?: CredentialProvider[];
}

@injectable()
export class Configuration {
  private readonly SCHEMA_REGEXP = /^.+:\/\//;
  private readonly CLUSTER_NORMALIZATION_REGEXP = /^(?!(?:\w+:)?\/\/)|^\/\//;

  private _credentialProviders?: CredentialProvider[];

  get credentialProviders(): readonly CredentialProvider[] | undefined {
    return this._credentialProviders;
  }

  private _container = container.createChildContainer();

  get container() {
    return this._container;
  }

  private _credentials?: Credentials;

  get credentials() {
    return this._credentials;
  }

  private _bus!: string;

  get bus() {
    return this._bus;
  }

  private _api!: string;

  get api() {
    return this._api;
  }

  private _logLevel?: LogLevel;

  get logLevel() {
    return this._logLevel;
  }

  /**
   * @deprecated use {@link version} right after v1 has been released
   */
  get repeaterVersion(): string {
    return secTester.repeaterVersion;
  }

  get version(): string {
    return version;
  }

  get name(): string {
    return secTester.name;
  }

  constructor({
    cluster,
    credentials,
    logLevel = LogLevel.ERROR,
    credentialProviders = [new EnvCredentialProvider()]
  }: ConfigurationOptions) {
    if (!credentials && !credentialProviders?.length) {
      throw new Error(
        `Please provide either 'credentials' or 'credentialProviders'`
      );
    }

    if (credentials) {
      this._credentials = new Credentials(credentials);
    }

    this._credentialProviders = credentialProviders;

    if (!cluster) {
      throw new Error(`Please provide 'cluster' option.`);
    }

    this.resolveUrls(cluster);

    this._logLevel = logLevel;

    this._container.register(Configuration, { useValue: this });
  }

  public async loadCredentials(): Promise<void> {
    if (!this.credentials) {
      const chain = (this.credentialProviders ?? []).map(provider =>
        provider.get()
      );
      const credentials = await first(chain, val => !!val);

      if (!credentials) {
        throw new Error('Could not load credentials from any providers');
      }

      this._credentials = new Credentials(credentials);
    }
  }

  private resolveUrls(cluster: string): void {
    if (!this.SCHEMA_REGEXP.test(cluster)) {
      cluster = cluster.replace(this.CLUSTER_NORMALIZATION_REGEXP, 'https://');
    }

    let hostname = cluster;

    try {
      ({ hostname } = new URL(cluster));
    } catch {
      throw new Error(
        `Please make sure that you pass correct 'cluster' option.`
      );
    }

    if (['localhost', '127.0.0.1'].includes(hostname)) {
      this._bus = `amqp://${hostname}:5672`;
      this._api = `http://${hostname}:8000`;
    } else {
      this._bus = `amqps://amq.${hostname}:5672`;
      this._api = `https://${hostname}`;
    }
  }
}
