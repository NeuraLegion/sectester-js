export interface RateLimitPolicy {
  limit: number;
  window: number;
  type: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  policy?: RateLimitPolicy;
}

export class RateLimiter {
  public extractRateLimitInfo(response: Response): RateLimitInfo {
    const rateLimitHeader = response.headers.get('RateLimit');
    const policyHeader = response.headers.get('RateLimit-Policy');

    const rateLimit = this.parseRateLimitHeader(rateLimitHeader);
    const policy = this.parsePolicyHeader(policyHeader);

    return {
      policy,
      limit: rateLimit.limit ?? 0,
      remaining: rateLimit.remaining ?? 0,
      reset: rateLimit.reset ?? 0
    };
  }

  public parseRateLimitHeader(header: string | null): Partial<RateLimitInfo> {
    if (!header) return {};

    const parts = header.split(',');
    const result: Partial<RateLimitInfo> = {};

    parts.forEach(part => {
      const [key, value]: string[] = part.split('=');
      switch (key) {
        case 'limit':
          result.limit = parseInt(value, 10);
          break;
        case 'remaining':
          result.remaining = parseInt(value, 10);
          break;
        case 'reset':
          result.reset = parseInt(value, 10);
          break;
      }
    });

    return result;
  }

  public parsePolicyHeader(header: string | null): RateLimitPolicy | undefined {
    if (!header) return undefined;

    const parts = header.split(';');
    if (parts.length < 3) return undefined;

    const result: RateLimitPolicy = {
      limit: 0,
      window: 0,
      type: ''
    };

    const [limit, ...rest]: string[] = parts;

    result.limit = parseInt(limit, 10);

    rest.forEach(part => {
      const [key, value]: [string, string] = part
        .split('=', 2)
        .map(s => s.trim()) as [string, string];
      switch (key) {
        case 'window':
          result.window = parseInt(value, 10);
          break;
        case 'type':
          result.type = value;
          break;
      }
    });

    if (result.limit && result.window && result.type) {
      return result;
    }

    return undefined;
  }
}
