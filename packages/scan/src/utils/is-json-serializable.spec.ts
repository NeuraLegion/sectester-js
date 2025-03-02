// eslint-disable-next-line max-classes-per-file
import { isJsonSerializable } from './is-json-serializable';

describe('isJsonSerializable', () => {
  it.each([
    { input: {}, expected: true, name: 'empty object' },
    { input: { a: 1, b: 2 }, expected: true, name: 'object with properties' },
    { input: [], expected: true, name: 'empty array' },
    { input: [1, 2, 3], expected: true, name: 'array with values' },
    { input: null, expected: true, name: 'null' },
    { input: new Map(), expected: false, name: 'Map instance' },
    { input: new Set(), expected: false, name: 'Set instance' },
    { input: 42, expected: true, name: 'number primitive' },
    { input: 'string', expected: true, name: 'string primitive' },
    { input: true, expected: true, name: 'boolean primitive' },
    { input: BigInt(42), expected: false, name: 'bigint primitive' },
    {
      input: new (class CustomClass {})(),
      expected: true,
      name: 'custom class instance'
    },
    {
      input: new (class AnotherCustomClass extends class CustomClass {} {})(),
      expected: true,
      name: 'another custom class instance'
    },
    { input: new Date(), expected: true, name: 'Date instance' }
  ])('should return $expected for $name', ({ input, expected }) => {
    expect(isJsonSerializable(input)).toBe(expected);
  });
});
