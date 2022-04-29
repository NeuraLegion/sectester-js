import { checkBoundaries } from './check-boundaries';

describe('checkBoundaries', () => {
  it.each([
    {
      input: {
        value: 'number'
      },
      expected: false
    },
    {
      input: {
        value: '20'
      },
      expected: true
    },
    {
      input: {
        value: Number.MAX_VALUE
      },
      expected: true
    },
    {
      input: {
        value: Number.MIN_VALUE
      },
      expected: true
    },
    {
      input: {
        value: Number.MIN_VALUE,
        min: Number.MIN_SAFE_INTEGER
      },
      expected: true
    },
    {
      input: {
        value: 10.1
      },
      expected: true
    },
    {
      input: {
        value: '10.1',
        min: 10,
        max: 11
      },
      expected: true
    },
    {
      input: {
        value: 10,
        max: 10
      },
      expected: true
    },
    {
      input: {
        value: 10,
        min: 10
      },
      expected: true
    },
    {
      input: {
        value: 9,
        max: 10,
        exclusiveMax: true
      },
      expected: true
    },
    {
      input: {
        value: 11,
        min: 10,
        exclusiveMin: true
      },
      expected: true
    },
    {
      input: {
        value: 5,
        min: 5,
        max: 10,
        exclusiveMin: false,
        exclusiveMax: true
      },
      expected: true
    },
    {
      input: {
        value: 10,
        min: 10,
        max: 10,
        exclusiveMin: true,
        exclusiveMax: true
      },
      expected: false
    },
    {
      input: {
        value: 0,
        min: 0
      },
      expected: true
    },
    {
      input: {
        value: 1,
        min: 0,
        exclusiveMin: true
      },
      expected: true
    },
    {
      input: {
        value: -1,
        max: 0,
        exclusiveMax: true
      },
      expected: true
    },
    {
      input: {
        value: 10,
        min: 10,
        max: 15
      },
      expected: true
    }
  ])('should return $expected for $input', ({ input, expected }) => {
    // act
    const result = checkBoundaries(input.value, input);

    // arrange
    expect(result).toEqual(expected);
  });
});
