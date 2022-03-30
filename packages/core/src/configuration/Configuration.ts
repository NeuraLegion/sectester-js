import { CredentialProvider, Credentials } from '../credentials-provider';
import { container, DependencyContainer, injectable } from 'tsyringe';

export interface ConfigurationOptions {
  credentials?: Credentials;
  cluster: string;
  credentialProviders?: CredentialProvider[];
}

@injectable()
export class Configuration {
  public readonly bus?: string;
  public readonly api?: string;
  public readonly credentialProviders?: CredentialProvider[];

  private _credentials?: Credentials;
  private _container = container.createChildContainer();

  get container(): DependencyContainer {
    return this._container;
  }

  get credentials() {
    return this._credentials;
  }

  constructor(options: ConfigurationOptions) {
    this._credentials = options.credentials;
    this.bus = options.bus;
    this.api = options.api;
    this.credentialProviders = options.credentialProviders;

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
