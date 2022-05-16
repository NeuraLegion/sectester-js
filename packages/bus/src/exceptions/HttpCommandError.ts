import { AxiosError } from 'axios';
import { SecTesterError } from '@sec-tester/core';

export class HttpCommandError extends SecTesterError {
  public readonly status: number | undefined;
  public readonly code: string | undefined;

  constructor(public readonly cause: AxiosError) {
    super(cause.response?.data ?? cause.message);
    this.status = cause.response?.status;
    this.code = cause.code;
  }
}
