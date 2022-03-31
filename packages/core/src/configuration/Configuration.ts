import { CredentialProvider, Credentials } from '../credentials-provider';
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

  private _credentials?: Credentials;
  private _api!: string;

  get credentials() {
    return this._credentials;
  }
  private _bus!: string;

  get api() {
    return this._api;
  }

  constructor(options: ConfigurationOptions) {
    if (!options.credentials && !options.credentialProviders) {
      throw new Error(
        `Please provide either 'credentials' or 'credentialProviders'`
      );
    }

    this._credentials = options.credentials;
    this._credentialProviders = options.credentialProviders;

    if (!options.cluster) {
      throw new Error(`Please provide 'cluster' option.`);
    }

    this.resolveUrls(options.cluster);

    this._container.register(Configuration, { useValue: this });
  }

  get bus() {
    return this._bus;
  }

  get container() {
    return this._container;
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
      // noop
    }

    if (['localhost', '127.0.0.1'].includes(hostname)) {
      this._bus = `amqp://${hostname}:5672`;
      this._api = `http://${hostname}:8000`;
    } else if (hostname) {
      this._bus = `amqps://amq.${hostname}:5672`;
      this._api = `https://${hostname}`;
    } else {
      throw new Error(
        `Please make sure that you pass correct 'cluster' option.`
      );
    }
  }
}
