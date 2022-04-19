import 'reflect-metadata';
import { ExecuteRequestEventHandler } from './ExecuteRequestEventHandler';
import { Protocol } from '../models';
import { RequestRunner } from '../request-runner';
import { anything, instance, mock, reset, when } from 'ts-mockito';

describe('ExecuteRequestEventHandler', () => {
  const responsePayload = {
    protocol: Protocol.HTTP,
    statusCode: 200,
    body: 'text'
  };

  const MockedRequestRunner = mock<RequestRunner>();

  beforeEach(() => {
    when(MockedRequestRunner.protocol).thenReturn(Protocol.HTTP);
    when(MockedRequestRunner.run(anything())).thenResolve(responsePayload);
  });

  afterEach(() => reset(MockedRequestRunner));

  describe('handle', () => {
    it('should run request having corresponding runner', async () => {
      const requestPayload = {
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        headers: {}
      };
      const handler = new ExecuteRequestEventHandler([
        instance(MockedRequestRunner)
      ]);

      const res = handler.handle(requestPayload);

      await expect(res).resolves.toEqual(responsePayload);
    });

    it('should throw an error if cannot find corresponding runner', async () => {
      const handler = new ExecuteRequestEventHandler([]);

      const res = handler.handle({
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        headers: {}
      });

      await expect(res).rejects.toThrow(`Unsupported protocol "http"`);
    });
  });
});
