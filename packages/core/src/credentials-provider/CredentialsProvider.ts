export interface Credentials {
  readonly token: string;
}

export interface CredentialProvider {
  get(): Promise<Credentials | undefined>;
}

export const CredentialProvider: unique symbol = Symbol('CredentialProvider');
