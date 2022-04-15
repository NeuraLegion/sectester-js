import { WsRequestRunner } from './WsRequestRunner';
import { Request } from '../Request';
import { RequestRunnerOptions } from '../RequestRunnerOptions';
import { Protocol } from '../../models';
import 'reflect-metadata';
import { reset, spy, when } from 'ts-mockito';
import { Server } from 'ws';
import { Logger, LogLevel } from '@secbox/core';
import { once } from 'events';

describe('WsRequestRunner', () => {
  const executorOptions: RequestRunnerOptions = { timeout: 2000 };
  const spiedExecutorOptions = spy<RequestRunnerOptions>(executorOptions);

  let runner!: WsRequestRunner;

  beforeEach(() => {
    // ADHOC: ts-mockito resets object's property descriptor as well
    Object.assign(executorOptions, { timeout: 2000 });
    runner = new WsRequestRunner(executorOptions, new Logger(LogLevel.SILENT));
  });

  afterEach(() => reset<RequestRunnerOptions>(spiedExecutorOptions));

  describe('protocol', () => {
    it('should use WS protocol', () =>
      expect(runner.protocol).toBe(Protocol.WS));
  });

  describe('execute', () => {
    let server: Server;
    let wsPort: number;

    beforeEach(async () => {
      server = new Server({ port: 0 });
      await once(server, 'listening');

      const address = server.address();
      if (typeof address === 'string') {
        throw new Error('Unsupported server address type');
      }

      wsPort = address.port;
    });

    afterEach(
      () =>
        new Promise(done => {
          wsPort = NaN;
          server.close(done);
        })
    );

    it('should send request body to a web-socket server', () => {
      const url = `ws://localhost:${wsPort}`;
      const headers = {};
      const body = 'test request body';
      const request = new Request({ url, headers, body });

      server.on('connection', socket => {
        socket.on('message', data => {
          expect(data).toBeInstanceOf(Buffer);
          expect(data.toString()).toBe(body);
          socket.send('test reply');
        });
      });

      return runner.run(request);
    });

    it('should fail sending request by timeout', async () => {
      when(spiedExecutorOptions.timeout).thenReturn(1);

      const url = `ws://localhost:${wsPort}`;
      const request = new Request({ url, headers: {} });

      const response = await runner.run(request);

      expect(response).toEqual({
        body: undefined,
        errorCode: 'ETIMEDOUT',
        headers: undefined,
        message: 'Waiting frame has timed out',
        protocol: 'ws',
        statusCode: undefined
      });
    });

    it('should not allow setting forbidden headers', () => {
      const url = `ws://localhost:${wsPort}`;
      const headers = { 'test-header': 'test-header-value' };
      WsRequestRunner.FORBIDDEN_HEADERS.forEach(
        headerName => (headers[headerName] = 'forbidden-header-value')
      );
      const request = new Request({ url, headers });

      server.on('connection', (socket, req) => {
        WsRequestRunner.FORBIDDEN_HEADERS.forEach(headerName => {
          expect(req.headers[headerName]).not.toBe('forbidden-header-value');
        });

        expect(req.headers['test-header']).toBe('test-header-value');

        socket.on('message', () => {
          socket.send('test reply');
        });
      });

      return runner.run(request);
    });

    it('should get the response from server', async () => {
      const url = `ws://localhost:${wsPort}`;
      const data = 'test reply';
      const request = new Request({ url, headers: {} });

      server.on('connection', socket => {
        socket.on('message', () => {
          socket.send(data, { binary: false, compress: false });
        });
      });

      const response = await runner.run(request);

      expect(response.body).toBe(data);
    });
  });
});
