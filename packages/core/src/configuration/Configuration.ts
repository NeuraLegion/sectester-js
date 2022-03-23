import { CredentialProvider, Credentials } from './CredentialsProvider';
import { container, DependencyContainer, injectable } from 'tsyringe';

export interface SdkConfiguration {
  credentials?: Credentials;
  bus?: string;
  api?: string;
}

export interface ConfigurationOptions extends SdkConfiguration {
  credentialProviders?: Array<CredentialProvider>;
}

@injectable()
export class Configuration {
  private options: ConfigurationOptions;
  private _container = container.createChildContainer();

  get container(): DependencyContainer {
    return this._container;
  }

  constructor(options: ConfigurationOptions) {
    this.options = options;
    this._container.register(Configuration, { useValue: this });
  }

  public get<T extends keyof SdkConfiguration>(key: T): SdkConfiguration[T] {
    return this.options[key];
  }

  public async loadCredentials(): Promise<void> {
    for (const provider of this.options.credentialProviders || []) {
      this.options.credentials = await provider.get();

      if (this.options.credentials) {
        break;
      }
    }
  }
}
