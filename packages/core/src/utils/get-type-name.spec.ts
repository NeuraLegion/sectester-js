/* eslint-disable max-classes-per-file */
import { Command, Event } from '../bus';
import { getTypeName } from './get-type-name';

class Test {}

class TestEvent extends Event<string> {
  constructor() {
    super('TestEvent');
  }
}

class TestCommand extends Command<string, void> {
  constructor() {
    super('TestCommand');
  }
}

describe('getTypeName', () => {
  it.each([
    { input: new Test(), expected: 'Test' },
    { input: new TestEvent(), expected: 'TestEvent' },
    { input: new TestCommand(), expected: 'TestCommand' },
    { input: new Date(), expected: 'Date' },
    { input: 5, expected: 'Number' },
    { input: '', expected: 'String' }
  ])('should get name of type', ({ input, expected }) => {
    const result = getTypeName(input);
    expect(result).toEqual(expected);
  });

  it.each([{ input: undefined }, { input: null }])(
    'should throw if $input',
    ({ input }) => {
      expect(() => getTypeName(input)).toThrow();
    }
  );
});
