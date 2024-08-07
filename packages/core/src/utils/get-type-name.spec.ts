/* eslint-disable max-classes-per-file */
import { getTypeName } from './get-type-name';

class Test {}

class SubTest extends Test {
  constructor() {
    super();
  }
}

describe('getTypeName', () => {
  it.each([
    { input: new Test(), expected: 'Test' },
    { input: new SubTest(), expected: 'SubTest' },
    { input: new Date(), expected: 'Date' },
    { input: 5, expected: 'Number' },
    { input: '', expected: 'String' },
    { input: undefined, expected: undefined },
    { input: null, expected: undefined }
  ])('should return a type name of $input', ({ input, expected }) => {
    // act
    const result = input ? getTypeName(input) : getTypeName(input);

    // assert
    expect(result).toEqual(expected);
  });
});
