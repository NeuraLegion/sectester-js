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

  private constructor(options: ConfigurationOptions) {
    this.options = options;
    container.register(typeof Configuration, { useValue: this });
  }

  public static create(options: ConfigurationOptions): Configuration {
    if (container.isRegistered(typeof Configuration)) {
      return container.resolve<Configuration>(typeof Configuration);
    }

    return new Configuration(options);
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
