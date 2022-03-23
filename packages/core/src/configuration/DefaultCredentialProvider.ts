import { CredentialProvider, Credentials } from './CredentialsProvider';
import { injectable } from 'tsyringe';
import { env } from 'process';

@injectable()
export class EnvCredentialProvider implements CredentialProvider {
  public get(): Promise<Credentials | undefined> {
    const token = (env as any).BRIGHT_TOKEN;

    return Promise.resolve(token);
  }
}
