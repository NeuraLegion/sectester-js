import { HttpCommand } from '../commands';
import { AxiosCommandDispatcher } from './AxiosCommandDispatcher';
import { AxiosCommandDispatcherConfig } from './AxiosCommandDispatcherConfig';
import { reset, spy } from 'ts-mockito';
import nock from 'nock';

describe('AxiosCommandDispatcher', () => {
  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(() => {
    reset<AxiosCommandDispatcherConfig>(spiedOptions);
    nock.cleanAll();
    nock.restore();
  });

  afterAll(() => nock.enableNetConnect());

  const baseUrl = 'https://example.com';
  const options: AxiosCommandDispatcherConfig = {
    baseUrl,
    token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0'
  };

  let axiosDispatcher!: AxiosCommandDispatcher;
  let spiedOptions!: AxiosCommandDispatcherConfig;

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate();
    }
    spiedOptions = spy(options);
    axiosDispatcher = new AxiosCommandDispatcher(options);
  });

  describe('execute', () => {
    it('should send a command', async () => {
      // arrange
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST',
        expectReply: false
      });
      const scope = nock(baseUrl).post('/api/test').reply(204);

      // act
      await axiosDispatcher.execute(command);

      // assert
      expect(scope.isDone()).toBe(true);
    });

    it('should set an authorization header', async () => {
      // arrange
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST',
        expectReply: false
      });
      const scope = nock(baseUrl)
        .post('/api/test')
        .matchHeader('authorization', `api-key ${options.token}`)
        .reply(204);

      // act
      await axiosDispatcher.execute(command);

      // assert
      expect(scope.isDone()).toBe(true);
    });

    it('should set an correlation ID header', async () => {
      // arrange
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST',
        expectReply: false
      });
      const scope = nock(baseUrl)
        .post('/api/test')
        .matchHeader('x-correlation-id', command.correlationId)
        .reply(204);

      // act
      await axiosDispatcher.execute(command);

      // assert
      expect(scope.isDone()).toBe(true);
    });

    it('should set an date header', async () => {
      // arrange
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST',
        expectReply: false,
        createdAt: new Date(0)
      });
      const scope = nock(baseUrl)
        .post('/api/test')
        .matchHeader('date', command.createdAt.toISOString())
        .reply(204);

      // act
      await axiosDispatcher.execute(command);

      // assert
      expect(scope.isDone()).toBe(true);
    });

    it('should get a reply', async () => {
      // arrange
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST'
      });
      const expected = { baz: 'qux' };

      nock(baseUrl).post('/api/test').reply(
        200,
        { baz: 'qux' },
        {
          'content-type': 'application/json'
        }
      );

      // act
      const response = await axiosDispatcher.execute(command);

      // assert
      expect(response).toEqual(expected);
    });

    it('should throw a error if no response', async () => {
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST',
        ttl: 1
      });

      nock(baseUrl)
        .post('/api/test')
        .matchHeader('authorization', `api-key ${options.token}`)
        .delayBody(5)
        .reply(
          200,
          { baz: 'qux' },
          {
            'content-type': 'application/json'
          }
        );

      const result = axiosDispatcher.execute(command);

      await expect(result).rejects.toThrow(/timeout of \dms exceeded/);
    });

    it('should return undefined immediately if `expectReply` is false', async () => {
      // arrange
      const command = new HttpCommand({
        payload: { foo: 'bar' },
        url: '/api/test',
        method: 'POST',
        expectReply: false
      });

      nock(baseUrl).post('/api/test').reply(
        200,
        { baz: 'qux' },
        {
          'content-type': 'application/json'
        }
      );

      // act
      const result = await axiosDispatcher.execute(command);

      // assert
      expect(result).toBeUndefined();
    });
  });
});
