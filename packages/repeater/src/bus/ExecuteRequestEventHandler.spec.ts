import 'reflect-metadata';
import { ExecuteRequestEventHandler } from './ExecuteRequestEventHandler';
import { Protocol } from '../models';
import { RequestRunner } from '../request-runner';
import { HttpRequestRunner } from '../request-runner/protocols';
import { anything, instance, mock, when } from 'ts-mockito';

describe('ExecuteRequestEventHandler', () => {
  const responsePayload = {
    protocol: Protocol.HTTP,
    statusCode: 200,
    body: 'text'
  };

  const MockedRequestRunner = mock<RequestRunner>(HttpRequestRunner);

  when(MockedRequestRunner.protocol).thenReturn(Protocol.HTTP);
  when(MockedRequestRunner.run(anything())).thenResolve(responsePayload);

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
