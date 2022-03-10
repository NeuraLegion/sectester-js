import { CredentialProvider, Credentials } from './CredentialsProvider';
import { container, DependencyContainer } from 'tsyringe';

export interface SdkConfiguration {
  credentials?: Credentials;
  bus?: string;
  api?: string;
}

export interface ConfigurationOptions extends SdkConfiguration {
  credentialProviders?: Array<CredentialProvider>;
}

export class Configuration {
  private options: ConfigurationOptions;
  get container(): DependencyContainer {
    return container;
  }

  constructor(options: ConfigurationOptions) {
    this.options = options;
    this.container.register(Configuration, { useValue: this });
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
