import { CommandDispatcher } from './CommandDispatcher';
import { Command } from './Command';
import { instance, mock, reset, verify, when } from 'ts-mockito';

class TestCommand extends Command<string, string | undefined> {
  constructor({
    payload,
    expectReply,
    ttl
  }: {
    payload: string;
    expectReply?: boolean;
    ttl?: number;
  }) {
    super(payload, expectReply, ttl);
  }
}

describe('Command', () => {
  const mockDispatcher = mock<CommandDispatcher>();

  afterEach(() => reset(mockDispatcher));

  describe('constructor', () => {
    it('should set default values to props', () => {
      const payload = 'Test';

      const command = new TestCommand({ payload });

      expect(command).toMatchObject({
        payload,
        ttl: 10000,
        expectReply: true,
        type: 'TestCommand',
        createdAt: expect.any(Date),
        correlationId: expect.any(String)
      });
    });

    it('should set `ttl` if the value is bigger than 0', () => {
      const payload = 'Test';
      const ttl = 1;

      const command = new TestCommand({ payload, ttl });

      expect(command).toMatchObject({
        ttl
      });
    });

    it('should ignore `ttl` if the value is less or equal 0', () => {
      const payload = 'Test';
      const ttl = 0;

      const command = new TestCommand({ payload, ttl });

      expect(command).toMatchObject({
        ttl: 10000
      });
    });

    it('should set `expectReply`', () => {
      const payload = 'Test';
      const expectReply = false;

      const command = new TestCommand({ payload, expectReply });

      expect(command).toMatchObject({
        expectReply
      });
    });
  });

  describe('execute', () => {
    it('should dispatch command', async () => {
      const command = new TestCommand({ payload: 'Test' });
      when(mockDispatcher.execute(command)).thenResolve();

      await command.execute(instance(mockDispatcher));

      verify(mockDispatcher.execute(command)).once();
    });

    it('should return a result of execution', async () => {
      const command = new TestCommand({ payload: 'Test' });
      when(mockDispatcher.execute(command)).thenResolve('result');

      const result = await command.execute(instance(mockDispatcher));

      expect(result).toEqual('result');
    });

    it('should rethrow an exception', async () => {
      const event = new TestCommand({ payload: 'Test' });
      when(mockDispatcher.execute(event)).thenReject();

      const result = event.execute(instance(mockDispatcher));

      await expect(result).rejects.toThrow();
    });
  });
});
