import { isJson } from './is-json';

describe('isJson', () => {
  it.each([
    { input: '{}', expected: true, name: 'empty object' },
    {
      input: '{"name":"John", "age":30}',
      expected: true,
      name: 'simple object'
    },
    {
      input: '{"nested": {"key": "value"}}',
      expected: true,
      name: 'nested object'
    },
    { input: '[]', expected: true, name: 'empty array' },
    { input: '[1, 2, 3]', expected: true, name: 'array with numbers' },
    {
      input: '[{"name": "John"}, {"name": "Jane"}]',
      expected: true,
      name: 'array with objects'
    },
    { input: 'abc', expected: false, name: 'plain string' },
    { input: '{', expected: false, name: 'opening brace only' },
    { input: ']', expected: false, name: 'closing bracket only' },
    { input: '{]', expected: false, name: 'mismatched brackets' },
    { input: '[}', expected: false, name: 'mismatched brackets 2' },
    {
      input: '{name:"John"}',
      expected: false,
      name: 'missing quotes around property'
    },
    { input: '[1, 2, 3', expected: false, name: 'missing closing bracket' },
    { input: '{"a":1,}', expected: false, name: 'trailing comma' }
  ])('should return $expected for $name', ({ input, expected }) => {
    expect(isJson(input)).toBe(expected);
  });
});
