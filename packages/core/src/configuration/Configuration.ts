import { CredentialProvider, Credentials } from '../credentials-provider';
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
  private _options: ConfigurationOptions;
  private _container = container.createChildContainer();

  get container(): DependencyContainer {
    return this._container;
  }

  get options(): SdkConfiguration {
    return this._options;
  }

  constructor(options: ConfigurationOptions) {
    this._options = options;
    this._container.register(Configuration, { useValue: this });
  }

  public async loadCredentials(): Promise<void> {
    for (const provider of this._options.credentialProviders || []) {
      const credentials = await provider.get();

      if (credentials) {
        this._options.credentials = credentials;
        break;
      }
    }
  }
}
