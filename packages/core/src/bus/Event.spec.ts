import { EventDispatcher } from './EventDispatcher';
import { Event } from './Event';
import { instance, mock, reset, verify, when } from 'ts-mockito';

class TestEvent extends Event<string> {
  constructor(payload: string) {
    super(payload);
  }
}

describe('Event', () => {
  const mockDispatcher = mock<EventDispatcher>();

  afterEach(() => reset(mockDispatcher));

  describe('publish', () => {
    it('should publish event', async () => {
      const event = new TestEvent('Test');
      when(mockDispatcher.publish(event)).thenResolve();

      await event.publish(instance(mockDispatcher));

      verify(mockDispatcher.publish(event)).once();
    });

    it('should rethrow an exception', async () => {
      const event = new TestEvent('Test');
      when(mockDispatcher.publish(event)).thenReject();

      const result = event.publish(instance(mockDispatcher));

      await expect(result).rejects.toThrow();
    });
  });
});
