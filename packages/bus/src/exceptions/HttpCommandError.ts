import { AxiosError } from 'axios';
import { SecTesterError, isStream, isPresent } from '@sectester/core';

export class HttpCommandError extends SecTesterError {
  public readonly status: number | undefined;
  public readonly code: string | undefined;
  public readonly method: string | undefined;

  constructor(public readonly cause: AxiosError) {
    super();
    const {
      message,
      code,
      config: { method } = {},
      response: { data, status } = {}
    } = cause;

    this.method = method;
    this.message = !isStream(data) && isPresent(data) ? data : message;
    this.status = status;
    this.code = code;
  }
}
