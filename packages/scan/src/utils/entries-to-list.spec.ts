import { entriesToList } from './entries-to-list';

describe('entriesToList', () => {
  it.each([
    Object.entries({ foo: 'bar', bar: ['foo', 'baz'] }) as [
      string,
      string | string[]
    ][],
    new Map<string, string | string[]>([
      ['foo', 'bar'],
      ['bar', ['foo', 'baz']]
    ]),
    new URLSearchParams('foo=bar&bar=foo&bar=baz')
  ])('should convert entries (%o) to list', input => {
    // act
    const result = entriesToList(input);

    // assert
    expect(result).toEqual([
      { name: 'foo', value: 'bar' },
      { name: 'bar', value: 'foo' },
      { name: 'bar', value: 'baz' }
    ]);
  });
});
