import { RateLimiter } from './RateLimiter';

describe('RateLimiter', () => {
  let sut: RateLimiter;

  beforeEach(() => {
    sut = new RateLimiter();
  });

  describe('extractRateLimitInfo', () => {
    it('should extract rate limit info from response headers', () => {
      const headers = new Headers({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'RateLimit': 'limit=100,remaining=99,reset=1234567890',
        'RateLimit-Policy': '100;window=60;type=sliding_window'
      });
      const response = new Response(null, { headers });

      const result = sut.extractRateLimitInfo(response);

      expect(result).toEqual({
        limit: 100,
        remaining: 99,
        reset: 1234567890,
        policy: {
          limit: 100,
          window: 60,
          type: 'sliding_window'
        }
      });
    });

    it('should handle missing headers', () => {
      const response = new Response(null);

      const result = sut.extractRateLimitInfo(response);

      expect(result).toEqual({
        limit: 0,
        remaining: 0,
        reset: 0,
        policy: undefined
      });
    });
  });

  describe('parseRateLimitHeader', () => {
    it('should parse valid rate limit header', () => {
      const header = 'limit=100,remaining=99,reset=1234567890';

      const result = sut.parseRateLimitHeader(header);

      expect(result).toEqual({
        limit: 100,
        remaining: 99,
        reset: 1234567890
      });
    });

    it('should handle partial rate limit header', () => {
      const header = 'limit=100,remaining=99';

      const result = sut.parseRateLimitHeader(header);

      expect(result).toEqual({
        limit: 100,
        remaining: 99
      });
    });

    it('should handle null header', () => {
      const result = sut.parseRateLimitHeader(null);

      expect(result).toEqual({});
    });

    it('should handle empty header', () => {
      const result = sut.parseRateLimitHeader('');

      expect(result).toEqual({});
    });
  });

  describe('parsePolicyHeader', () => {
    it('should parse valid policy header', () => {
      const header = '100;window=60;type=sliding_window';

      const result = sut.parsePolicyHeader(header);

      expect(result).toEqual({
        limit: 100,
        window: 60,
        type: 'sliding_window'
      });
    });

    it('should return undefined for null header', () => {
      const result = sut.parsePolicyHeader(null);

      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid header format', () => {
      const header = '100;window=60';

      const result = sut.parsePolicyHeader(header);

      expect(result).toBeUndefined();
    });

    it('should return undefined if required fields are missing', () => {
      const header = '100;window=60;type=';

      const result = sut.parsePolicyHeader(header);

      expect(result).toBeUndefined();
    });

    it('should handle whitespace in header', () => {
      const header = '100; window=60; type=sliding_window';

      const result = sut.parsePolicyHeader(header);

      expect(result).toEqual({
        limit: 100,
        window: 60,
        type: 'sliding_window'
      });
    });
  });
});
