import { CredentialProvider, Credentials } from './CredentialsProvider';
import { env } from 'process';

export class EnvCredentialProvider implements CredentialProvider {
  public get(): Promise<Credentials | undefined> {
    const token = (env as any).BRIGHT_TOKEN;

    return Promise.resolve({ token } as Credentials);
  }
}
