export interface CredentialsOptions {
  readonly token: string;
}

export class Credentials {
  private readonly TOKEN_VALIDATION_REGEXP =
    /^[A-Za-z0-9+/=]{7}\.nex[apr]\.[A-Za-z0-9+/=]{32}$/;

  private _token: string;

  get token(): string {
    return this._token;
  }

  constructor({ token }: CredentialsOptions) {
    if (!token) {
      throw new Error('Provide an API key.');
    }

    if (!this.TOKEN_VALIDATION_REGEXP.test(token)) {
      throw new Error('Unable to recognize the API key.');
    }

    this._token = token;
  }
}
