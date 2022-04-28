import { contains } from './contains';

describe('contains', () => {
  enum TestEnum1 {
    VALUE1 = 'value1',
    VALUE2 = 'value2'
  }

  enum TestEnum2 {
    VALUE1,
    VALUE2
  }

  it.each([
    { type: TestEnum2, input: TestEnum2.VALUE1, expected: true },
    { type: TestEnum1, input: TestEnum1.VALUE1, expected: true },
    { type: TestEnum1, input: 'value3', expected: false },
    { type: TestEnum2, input: 3, expected: false }
  ])(
    'should return $expected if $input is passed ($type)',
    ({ type, input, expected }) => {
      // act
      const result = contains(type, input);

      // assert
      expect(result).toEqual(expected);
    }
  );
});
