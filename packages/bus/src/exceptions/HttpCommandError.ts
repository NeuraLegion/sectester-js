import { AxiosError } from 'axios';
import { SecTesterError, isStream, isPresent } from '@sec-tester/core';

export class HttpCommandError extends SecTesterError {
  public readonly status: number | undefined;
  public readonly code: string | undefined;

  constructor(public readonly cause: AxiosError) {
    super();
    const { code, response: { data, status } = {} } = cause;
    let { message } = cause;

    if (!isStream(data) && isPresent(data)) {
      message = data;
    }

    this.message = message;
    this.status = status;
    this.code = code;
  }
}
