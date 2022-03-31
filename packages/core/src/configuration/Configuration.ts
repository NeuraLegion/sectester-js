import { CredentialProvider, Credentials } from '../credentials-provider';
import { container, DependencyContainer, injectable } from 'tsyringe';

export interface ConfigurationOptions {
  credentials?: Credentials;
  cluster: string;
  credentialProviders?: CredentialProvider[];
}

@injectable()
export class Configuration {
  public readonly credentialProviders?: CredentialProvider[];

  private _credentials?: Credentials;
  private _api: string;
  private _bus: string;
  private _container = container.createChildContainer();

  get container(): DependencyContainer {
    return this._container;
  }

  get credentials() {
    return this._credentials;
  }

  get api() {
    return this._api;
  }

  get bus() {
    return this._bus;
  }

  constructor(options: ConfigurationOptions) {
    if (!options.credentials && !options.credentialProviders) {
      throw new Error(`Please provide 'credentials' or 'credentialProviders'`);
    }

    if (!options.cluster) {
      throw new Error(`Please provide 'cluster' option.`);
    }

    this._credentials = options.credentials;
    this.credentialProviders = options.credentialProviders;

    let host = options.cluster.split(/:\d+/)[0];

    try {
      ({ host } = new URL(host));
    } catch {
      // noop
    }

    if (['localhost', '127.0.0.1'].includes(host)) {
      this._bus = `amqp://${host}:5672`;
      this._api = `http://${host}:8000`;
    } else {
      this._bus = `amqps://amq.${host}:5672`;
      this._api = `https://${host}`;
    }

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
}
