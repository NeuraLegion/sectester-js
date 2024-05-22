import {
  DefaultRepeaterServer,
  DefaultRepeaterServerOptions,
  SocketEvents
} from './DefaultRepeaterServer';
import {
  RepeaterErrorCodes,
  RepeaterServerEventHandler,
  RepeaterServerEvents
} from './RepeaterEventHub';
import { Protocol } from '../models/Protocol';
import { DefaultRepeaterEventHub } from './DefaultRepeaterEventHub';
import { RepeaterCommandHub } from './RepeaterCommandHub';
import { delay, Logger } from '@sectester/core';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { Server } from 'socket.io';
import msgpack from 'socket.io-msgpack-parser';
import { createServer, Server as HttpServer } from 'http';

class MockSocketServer {
  private readonly httpServer: HttpServer;
  private readonly io: Server;

  get address() {
    const address = this.httpServer.address();
    if (typeof address === 'string') {
      return address;
    }

    return `http://localhost:${address?.port}`;
  }

  constructor() {
    this.httpServer = createServer();

    this.httpServer.listen(0);

    this.io = new Server(this.httpServer, {
      path: '/api/ws/v1',
      parser: msgpack
    });
  }

  public onConnection(callback: (socket: any) => void) {
    this.io.on('connection', callback);
  }

  public close() {
    this.io.close();
  }

  public emit(event: string, data: any) {
    this.io.sockets.emit(event, data);
  }
}

describe('DefaultRepeaterServer', () => {
  const RepeaterId = 'fooId';

  let events!: DefaultRepeaterEventHub;
  let sut!: DefaultRepeaterServer;
  let mockServer!: MockSocketServer;

  const mockedLogger = mock<Logger>();
  const mockedDefaultRepeaterServerOptions =
    mock<DefaultRepeaterServerOptions>();

  beforeEach(() => {
    mockServer = new MockSocketServer();

    events = new DefaultRepeaterEventHub();

    sut = new DefaultRepeaterServer(
      instance(mockedLogger),
      events,
      instance(mockedDefaultRepeaterServerOptions)
    );

    const address = mockServer.address;

    when(mockedDefaultRepeaterServerOptions.uri).thenReturn(address);
    when(mockedDefaultRepeaterServerOptions.token).thenReturn('token');
    when(mockedDefaultRepeaterServerOptions.connectTimeout).thenReturn(10_00);
  });

  afterEach(() => {
    sut.disconnect();

    mockServer.close();

    reset<DefaultRepeaterServerOptions | RepeaterCommandHub | Logger>(
      mockedLogger,
      mockedDefaultRepeaterServerOptions
    );
  });

  describe('connect', () => {
    it('should connect', async () => {
      // act
      await sut.connect(RepeaterId);

      // assert
      verify(mockedLogger.debug('Repeater connected to %s', anything())).once();
    });
  });

  describe('deploy', () => {
    it('should deploy', async () => {
      // arrange
      const event = { repeaterId: RepeaterId };

      mockServer.onConnection(socket => {
        socket.on('deploy', () => {
          socket.emit('deployed', event);
        });
      });

      const handler: RepeaterServerEventHandler<any> = jest.fn();

      sut.events.on(RepeaterServerEvents.DEPLOY, handler);

      await sut.connect(RepeaterId);

      // act
      await sut.deploy({ repeaterId: RepeaterId });

      // assert
      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe('disconnect', () => {
    it('should disconnect', async () => {
      // arrange
      const handler: RepeaterServerEventHandler<any> = jest.fn();

      sut.events.on(RepeaterServerEvents.DEPLOY, handler);

      await sut.connect(RepeaterId);

      // act
      const act = () => sut.disconnect();

      // assert
      expect(act).not.toThrow();
    });
  });

  describe('on', () => {
    it.each([
      {
        input: {
          event: SocketEvents.UPDATE_AVAILABLE,
          data: { version: '1.0.0' }
        },
        expected: {
          event: RepeaterServerEvents.UPDATE_AVAILABLE,
          data: [{ version: '1.0.0' }]
        }
      },
      {
        input: {
          event: SocketEvents.ERROR,
          data: { code: RepeaterErrorCodes.UNKNOWN_ERROR, message: 'msg' }
        },
        expected: {
          event: RepeaterServerEvents.ERROR,
          data: [{ code: RepeaterErrorCodes.UNKNOWN_ERROR, message: 'msg' }]
        }
      },
      {
        input: {
          event: SocketEvents.REQUEST,
          data: { protocol: Protocol.HTTP, url: 'https://foo.com' }
        },
        expected: {
          event: RepeaterServerEvents.REQUEST,
          data: [{ protocol: Protocol.HTTP, url: 'https://foo.com' }, undefined]
        }
      }
    ])(
      'should propagate $input.event data to $expected.event',
      async ({ input, expected }) => {
        // arrange
        const handler: RepeaterServerEventHandler<any> = jest.fn();

        sut.events.on(expected.event, handler);

        await sut.connect(RepeaterId);

        // act
        mockServer.emit(input.event, input.data);

        // assert
        await delay(200);
        expect(handler).toHaveBeenCalledWith(...expected.data);
      }
    );
  });

  describe('off', () => {
    it('should not invoke handler when it switched off', async () => {
      // arrange
      const event = { code: RepeaterErrorCodes.UNKNOWN_ERROR, message: 'msg' };

      const handler: RepeaterServerEventHandler<any> = jest.fn();

      sut.events.on(RepeaterServerEvents.ERROR, handler);

      await sut.connect(RepeaterId);

      sut.events.off(RepeaterServerEvents.ERROR, handler);

      // act
      mockServer.emit(SocketEvents.ERROR, event);

      // assert
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
