import { HttpMethod, isHttpMethod } from './HttpMethod';

describe('HttpMethod', () => {
  describe('isHttpMethod', () => {
    it.each([
      ...[
        ...Object.values(HttpMethod),
        ...Object.values(HttpMethod).map(value => value.toLowerCase())
      ].map(input => ({ input, expected: true })),
      { input: 'foo', expected: false },
      { input: '', expected: false }
    ])(
      'should return $expected if "$input" matches once of HTTP methods',
      ({ input, expected }) => {
        // act
        const result = isHttpMethod(input);

        // assert
        expect(result).toEqual(expected);
      }
    );
  });
});
