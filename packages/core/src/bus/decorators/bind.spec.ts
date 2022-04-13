// eslint-disable-next-line max-classes-per-file
import 'reflect-metadata';
import { EventHandler } from '../EventHandler';
import { Event } from '../Event';
import { bind, EventName } from './bind';

describe('bind', () => {
  class ConcreteEvent extends Event<string> {
    constructor(payload: string) {
      super(payload);
    }
  }

  it.each([
    {
      input: ConcreteEvent,
      expected: 'ConcreteEvent'
    },
    {
      input: 'ConcreteEvent',
      expected: 'ConcreteEvent'
    },
    {
      input: Symbol('ConcreteEvent'),
      expected: 'ConcreteEvent'
    }
  ])('should discover event name from $input', ({ input, expected }) => {
    // arrange
    class ConcreteHandler implements EventHandler<string> {
      public async handle(_: string): Promise<void> {
        // noop
      }
    }

    // act
    bind(input)(ConcreteHandler);

    // assert
    expect(Reflect.getMetadata(Event, ConcreteHandler)).toEqual([expected]);
  });

  it('should throw an error if wrong argument is passed', () => {
    // arrange
    class ConcreteHandler implements EventHandler<string> {
      public async handle(_: string): Promise<void> {
        // noop
      }
    }

    // act/ assert
    expect(() =>
      bind(undefined as unknown as EventName)(ConcreteHandler)
    ).toThrow('undefined cannot be used with the @bind decorator');
  });
});
