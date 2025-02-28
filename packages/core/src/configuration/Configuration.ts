import {
  CredentialProvider,
  Credentials,
  CredentialsOptions,
  EnvCredentialProvider
} from '../credentials-provider';
import { first } from '../utils';
import { LogLevel } from '../logger';
import { version, secTester } from '../../package.json';
import { Projects } from '../Projects';
import { container } from 'tsyringe';

export interface ConfigurationOptions {
  hostname: string;
  projectId?: string;
  logLevel?: LogLevel;
  credentials?: Credentials | CredentialsOptions;
  credentialProviders?: CredentialProvider[];
}

export class Configuration {
  private readonly SCHEMA_REGEXP = /^.+:\/\//;
  private readonly HOSTNAME_NORMALIZATION_REGEXP = /^(?!(?:\w+:)?\/\/)|^\/\//;

  private _fetchProjectIdPromise?: Promise<void>;
  private _loadCredentialsPromise?: Promise<void>;

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
    if (!this._credentials) {
      throw new Error(
        'Please provide credentials or try to load them using `loadCredentials()`.'
      );
    }

    return this._credentials;
  }

  private _projectId?: string;

  get projectId() {
    if (!this._projectId) {
      throw new Error(
        'Please provide a project ID or call `fetchProjectId()` to use the default project.'
      );
    }

    return this._projectId;
  }

  private _baseURL!: string;

  get baseURL() {
    return this._baseURL;
  }

  private _logLevel?: LogLevel;

  get logLevel() {
    return this._logLevel;
  }

  get version(): string {
    return version;
  }

  get name(): string {
    return secTester.name;
  }

  constructor({
    hostname,
    credentials,
    projectId,
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

    if (!hostname) {
      throw new Error(`Please provide 'hostname' option.`);
    }

    this.resolveUrls(hostname);

    this._projectId = projectId;

    this._logLevel = logLevel;

    this._container.register(Configuration, { useValue: this });
  }

  public async fetchProjectId(): Promise<void> {
    if (this._projectId) {
      return;
    }

    if (!this._fetchProjectIdPromise) {
      this._fetchProjectIdPromise = (async () => {
        try {
          const projects = this.container.resolve<Projects>(Projects);
          const { id } = await projects.getDefaultProject();
          this._projectId = id;
        } catch (error) {
          this._fetchProjectIdPromise = undefined;

          throw error;
        }
      })();
    }

    await this._fetchProjectIdPromise;
  }

  public async loadCredentials(): Promise<void> {
    if (this._credentials) {
      return;
    }

    if (!this._loadCredentialsPromise) {
      this._loadCredentialsPromise = (async () => {
        try {
          const chain = (this.credentialProviders ?? []).map(provider =>
            provider.get()
          );
          const credentials = await first(chain, val => !!val);

          if (!credentials) {
            throw new Error('Could not load credentials from any providers');
          }

          this._credentials = new Credentials(credentials);
        } catch (error) {
          this._loadCredentialsPromise = undefined;
          throw error;
        }
      })();
    }

    await this._loadCredentialsPromise;
  }

  private resolveUrls(hostname: string): void {
    if (!this.SCHEMA_REGEXP.test(hostname)) {
      hostname = hostname.replace(
        this.HOSTNAME_NORMALIZATION_REGEXP,
        'https://'
      );
    }

    try {
      ({ hostname } = new URL(hostname));
    } catch {
      throw new Error(
        `Please make sure that you pass correct 'hostname' option.`
      );
    }

    if (['localhost', '127.0.0.1'].includes(hostname)) {
      this._baseURL = `http://${hostname}:8000`;
    } else {
      this._baseURL = `https://${hostname}`;
    }
  }
}
