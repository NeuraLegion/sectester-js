import {
  CredentialProvider,
  Credentials,
  EnvCredentialProvider
} from '../credentials-provider';
import { container, injectable } from 'tsyringe';

export interface ConfigurationOptions {
  cluster: string;
  credentials?: Credentials;
  credentialProviders?: CredentialProvider[];
}

@injectable()
export class Configuration {
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

  constructor({
    cluster,
    credentials,
    credentialProviders = [new EnvCredentialProvider()]
  }: ConfigurationOptions) {
    if (!credentials && !credentialProviders?.length) {
      throw new Error(
        `Please provide either 'credentials' or 'credentialProviders'`
      );
    }

    this._credentials = credentials;
    this._credentialProviders = credentialProviders;

    if (!cluster) {
      throw new Error(`Please provide 'cluster' option.`);
    }

    this.resolveUrls(cluster);

    this._container.register(Configuration, { useValue: this });
  }

  public async loadCredentials(): Promise<void> {
    for (const provider of this.credentialProviders || []) {
      const credentials = await provider.get();

      if (credentials) {
        this._credentials = credentials;
        break;
      }
    }
  }

  private resolveUrls(cluster: string): void {
    if (!/^.+:\/\//.test(cluster)) {
      cluster = cluster.replace(/^(?!(?:\w+:)?\/\/)|^\/\//, 'https://');
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
