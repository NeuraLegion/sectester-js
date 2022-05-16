import { AxiosError } from 'axios';

export class HttpCommandError extends Error {
  public readonly status: number | undefined;
  public readonly code: string | undefined;

  constructor(public readonly cause: AxiosError) {
    super(cause.response?.data ?? cause.message);
    this.name = new.target.name;
    this.status = cause.response?.status;
    this.code = cause.code;
  }
}
