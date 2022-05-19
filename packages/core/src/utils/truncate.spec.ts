import { truncate } from './truncate';

describe('truncate', () => {
  it.each([
    { input: { str: 'aa', n: 2 }, expected: 'aa' },
    { input: { str: 'test', n: 2 }, expected: 't…' },
    { input: { str: '', n: 2 }, expected: '' },
    { input: { str: 'test', n: 0 }, expected: '' },
    { input: { str: 'found a new issue', n: 6 }, expected: 'found ' },
    { input: { str: '******', n: 4 }, expected: '****' }
  ])(
    'should return "$expected" for "$input.str" when limit is $input.n',
    ({ input, expected }) => {
      // act
      const result = truncate(input.str, input.n);

      // assert
      expect(result).toEqual(expected);
    }
  );
});
