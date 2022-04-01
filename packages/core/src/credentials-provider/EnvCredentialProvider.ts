import { CredentialProvider } from './CredentialsProvider';
import { CredentialsOptions } from './Credentials';

export class EnvCredentialProvider implements CredentialProvider {
  // eslint-disable-next-line @typescript-eslint/require-await
  public async get(): Promise<CredentialsOptions | undefined> {
    const token = process.env.BRIGHT_TOKEN;

    return token ? { token } : undefined;
  }
}
