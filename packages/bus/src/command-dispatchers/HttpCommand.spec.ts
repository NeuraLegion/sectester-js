import { HttpCommand } from './HttpCommand';
import { CommandDispatcher } from '@secbox/core';
import { instance, mock, reset, verify, when } from 'ts-mockito';
import { Method } from 'axios';

class TestCommand extends HttpCommand<string, string | undefined> {
  constructor({
    payload,
    url,
    method,
    expectReply,
    ttl
  }: {
    payload: string;
    url: string;
    method: Method;
    expectReply?: boolean;
    ttl?: number;
  }) {
    super(payload, url, method, expectReply, ttl);
  }
}

describe('HttpCommand', () => {
  const mockDispatcher = mock<CommandDispatcher>();

  afterEach(() => reset(mockDispatcher));

  describe('constructor', () => {
    it('should set default values to props', () => {
      const payload = 'Test';
      const url = '/api/test';
      const method = 'GET';

      const command = new TestCommand({ payload, url, method });

      expect(command).toMatchObject({
        payload,
        url,
        method,
        ttl: 10000,
        expectReply: true,
        type: 'TestCommand',
        createdAt: expect.any(Date),
        correlationId: expect.any(String)
      });
    });
  });

  describe('execute', () => {
    it('should dispatch command', async () => {
      const command = new TestCommand({
        payload: 'Test',
        url: '/api/test',
        method: 'GET'
      });
      when(mockDispatcher.execute(command)).thenResolve();

      await command.execute(instance(mockDispatcher));

      verify(mockDispatcher.execute(command)).once();
    });

    it('should return a result of execution', async () => {
      const command = new TestCommand({
        payload: 'Test',
        url: '/api/test',
        method: 'GET'
      });
      when(mockDispatcher.execute(command)).thenResolve('result');

      const result = await command.execute(instance(mockDispatcher));

      expect(result).toEqual('result');
    });

    it('should rethrow an exception', async () => {
      const event = new TestCommand({
        payload: 'Test',
        url: '/api/test',
        method: 'GET'
      });
      when(mockDispatcher.execute(event)).thenReject();

      const result = event.execute(instance(mockDispatcher));

      await expect(result).rejects.toThrow();
    });
  });
});
