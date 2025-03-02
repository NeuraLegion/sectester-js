import { isStream } from './is-stream';
import { Readable } from 'stream';

describe('isStream', () => {
  it('should return true for a readable stream', () => {
    const stream = new Readable();
    expect(isStream(stream)).toBe(true);
  });

  it.each([
    { input: {}, expected: false, name: 'empty object' },
    { input: null, expected: false, name: 'null' },
    { input: undefined, expected: false, name: 'undefined' },
    { input: 'string', expected: false, name: 'string' },
    { input: 123, expected: false, name: 'number' },
    {
      input: { pipe: 'not a function' },
      expected: false,
      name: 'object with non-function pipe'
    }
  ])('should return $expected for $name', ({ input, expected }) => {
    expect(isStream(input)).toBe(expected);
  });

  it('should return true for objects with pipe method', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const mockStream = { pipe: () => {} };
    expect(isStream(mockStream)).toBe(true);
  });
});
