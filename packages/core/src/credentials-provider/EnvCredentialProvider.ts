import { CredentialProvider, Credentials } from './CredentialsProvider';

export class EnvCredentialProvider implements CredentialProvider {
  public get(): Promise<Credentials | undefined> {
    const token = process.env['BRIGHT_TOKEN'];

    return Promise.resolve(token ? { token } : undefined);
  }
}
