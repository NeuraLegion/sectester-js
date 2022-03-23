import { CredentialProvider, Credentials } from './CredentialsProvider';
import { injectable } from 'tsyringe';
import { env } from 'process';

@injectable()
export class EnvCredentialProvider implements CredentialProvider {
  public get(): Promise<Credentials | undefined> {
    return new Promise(resolve => {
      const token = (env as any).BRIGHT_TOKEN;
      if (token) {
        resolve({ token } as Credentials);
      } else {
        resolve(undefined);
      }
    });
  }
}
