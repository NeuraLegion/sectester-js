import { CredentialsOptions } from './Credentials';

export interface CredentialProvider {
  get(): Promise<CredentialsOptions | undefined>;
}

export const CredentialProvider: unique symbol = Symbol('CredentialProvider');
