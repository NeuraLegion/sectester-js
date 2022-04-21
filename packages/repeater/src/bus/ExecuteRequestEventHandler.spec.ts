import 'reflect-metadata';
import { ExecuteRequestEventHandler } from './ExecuteRequestEventHandler';
import { Protocol } from '../models';
import { RequestRunner } from '../request-runner';
import { anything, instance, mock, reset, when } from 'ts-mockito';

describe('ExecuteRequestEventHandler', () => {
  const requestRunnerResponse = {
    protocol: Protocol.HTTP,
    statusCode: 200,
    body: 'text'
  };

  const responsePayload = {
    protocol: Protocol.HTTP,
    status_code: 200,
    body: 'text'
  };

  const mockedRequestRunner = mock<RequestRunner>();

  beforeEach(() => {
    when(mockedRequestRunner.protocol).thenReturn(Protocol.HTTP);
    when(mockedRequestRunner.run(anything())).thenResolve(
      requestRunnerResponse
    );
  });

  afterEach(() => reset(mockedRequestRunner));

  describe('handle', () => {
    it('should run request having corresponding runner', async () => {
      const requestPayload = {
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        headers: {}
      };
      const handler = new ExecuteRequestEventHandler([
        instance(mockedRequestRunner)
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
