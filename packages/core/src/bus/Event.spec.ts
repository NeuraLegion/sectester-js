import { EventDispatcher } from './EventDispatcher';
import { Event } from './Event';
import { instance, mock, reset, verify, when } from 'ts-mockito';

class TestEvent extends Event<string> {
  constructor(
    payload: string,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, type, correlationId, createdAt);
  }
}

describe('Event', () => {
  const mockDispatcher = mock<EventDispatcher>();

  afterEach(() => reset(mockDispatcher));

  describe('publish', () => {
    it('should publish event', async () => {
      const event = new TestEvent('Test');
      when(mockDispatcher.publish(event)).thenResolve();

      const result = event.publish(instance(mockDispatcher));

      await expect(result).resolves.not.toThrow();
      verify(mockDispatcher.publish(event)).once();
    });

    it('should throw if dispatcher publish fauled', async () => {
      const event = new TestEvent('Test');
      when(mockDispatcher.publish(event)).thenReject();

      const result = event.publish(instance(mockDispatcher));

      await expect(result).rejects.toThrow();
      verify(mockDispatcher.publish(event)).once();
    });
  });
});
