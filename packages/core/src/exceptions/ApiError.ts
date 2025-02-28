import { SecTesterError } from './SecTesterError';

export class ApiError extends SecTesterError {
  constructor(
    public readonly response: Response,
    message?: string
  ) {
    super(message ?? `API request failed with status ${response.status}`);
  }
}
