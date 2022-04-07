// eslint-disable-next-line max-classes-per-file
import 'reflect-metadata';
import { EventHandler } from '../EventHandler';
import { Event } from '../Event';
import { bind } from './bind';

describe('bind', () => {
  it('should subscribe handler to event', () => {
    // arrange
    class ConcreteEvent extends Event<string> {
      constructor(payload: string) {
        super(payload);
      }
    }
    class ConcreteHandler implements EventHandler<string> {
      public async handle(_: string): Promise<void> {
        // noop
      }
    }

    // act
    bind(ConcreteEvent)(ConcreteHandler);

    // assert
    expect(Reflect.getMetadata(Event, ConcreteHandler)).toEqual([
      ConcreteEvent
    ]);
  });
});
