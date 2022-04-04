import { CommandDispatcher } from './CommandDispatcher';
import { Command } from './Command';
import { instance, mock, reset, verify, when } from 'ts-mockito';

class TestCommand extends Command<string, void> {
  constructor(
    payload: string,
    expectReply?: boolean,
    ttl?: number,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, expectReply, ttl, type, correlationId, createdAt);
  }
}

describe('Event', () => {
  const mockDispatcher = mock<CommandDispatcher>();

  afterEach(() => reset(mockDispatcher));

  describe('publish', () => {
    it('should publish event', async () => {
      const command = new TestCommand('Test');
      when(mockDispatcher.execute(command)).thenResolve();

      const result = command.execute(instance(mockDispatcher));

      await expect(result).resolves.not.toThrow();
      verify(mockDispatcher.execute(command)).once();
    });

    it('should throw if dispatcher publish fauled', async () => {
      const event = new TestCommand('Test');
      when(mockDispatcher.execute(event)).thenReject();

      const result = event.execute(instance(mockDispatcher));

      await expect(result).rejects.toThrow();
      verify(mockDispatcher.execute(event)).once();
    });
  });
});
