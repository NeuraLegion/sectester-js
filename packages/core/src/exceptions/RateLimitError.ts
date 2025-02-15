import { ApiError } from './ApiError';

export class RateLimitError extends ApiError {
  constructor(
    response: Response,
    public readonly retryAfter: number,
    message: string = `Rate limited, retry after ${retryAfter} seconds`
  ) {
    super(response, message);
  }
}
