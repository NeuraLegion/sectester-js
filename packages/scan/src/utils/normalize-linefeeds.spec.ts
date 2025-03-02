import { normalizeLinefeeds } from './normalize-linefeeds';

describe('normalizeLinefeeds', () => {
  it('should return empty string when given empty string', () => {
    expect(normalizeLinefeeds('')).toBe('');
  });

  it('should not modify string with no line endings', () => {
    const input = 'This is a test string with no line endings';
    expect(normalizeLinefeeds(input)).toBe(input);
  });

  it('should convert UNIX-style LF (\\n) to CRLF (\\r\\n)', () => {
    const input = 'Line 1\nLine 2\nLine 3';
    const expected = 'Line 1\r\nLine 2\r\nLine 3';
    expect(normalizeLinefeeds(input)).toBe(expected);
  });

  it('should convert Mac-style CR (\\r) to CRLF (\\r\\n)', () => {
    const input = 'Line 1\rLine 2\rLine 3';
    const expected = 'Line 1\r\nLine 2\r\nLine 3';
    expect(normalizeLinefeeds(input)).toBe(expected);
  });

  it('should not change existing CRLF (\\r\\n) line endings', () => {
    const input = 'Line 1\r\nLine 2\r\nLine 3';
    expect(normalizeLinefeeds(input)).toBe(input);
  });

  it('should handle mixed line endings correctly', () => {
    const input = 'Line 1\nLine 2\r\nLine 3\rLine 4';
    const expected = 'Line 1\r\nLine 2\r\nLine 3\r\nLine 4';
    expect(normalizeLinefeeds(input)).toBe(expected);
  });

  it('should handle strings with multiple consecutive line breaks', () => {
    const input = 'Line 1\n\n\nLine 2\r\r\rLine 3\r\n\r\nLine 4';
    const expected = 'Line 1\r\n\r\n\r\nLine 2\r\n\r\n\r\nLine 3\r\n\r\nLine 4';
    expect(normalizeLinefeeds(input)).toBe(expected);
  });
});
