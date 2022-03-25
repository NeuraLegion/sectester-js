import { CredentialProvider, Credentials } from './CredentialsProvider';
import { env } from 'process';

export class EnvCredentialProvider implements CredentialProvider {
  public get(): Promise<Credentials | undefined> {
    const token = env['BRIGHT_TOKEN'];

    return Promise.resolve(token ? { token } : undefined);
  }
}
