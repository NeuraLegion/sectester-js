import {
  DefaultRepeaterServer,
  DefaultRepeaterServerOptions,
  SocketEvents
} from './DefaultRepeaterServer';
import {
  RepeaterErrorCodes,
  RepeaterServerEventHandler,
  RepeaterServerEvents
} from './RepeaterServer';
import { Protocol } from '../models/Protocol';
import { RepeaterCommands } from './RepeaterCommands';
import { Logger } from '@sectester/core';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { Server } from 'socket.io';
import msgpack from 'socket.io-msgpack-parser';
import { createServer, Server as HttpServer } from 'http';
import { setTimeout } from 'node:timers/promises';

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
    void this.io.close();
  }

  public emit(event: string, data: any) {
    this.io.sockets.emit(event, data);
  }
}

describe('DefaultRepeaterServer', () => {
  const RepeaterId = 'fooId';

  let sut!: DefaultRepeaterServer;
  let mockSocketServer!: MockSocketServer;

  const mockedLogger = mock<Logger>();
  const mockedDefaultRepeaterServerOptions =
    mock<DefaultRepeaterServerOptions>();

  beforeEach(() => {
    mockSocketServer = new MockSocketServer();

    sut = new DefaultRepeaterServer(
      instance(mockedLogger),
      instance(mockedDefaultRepeaterServerOptions)
    );

    const address = mockSocketServer.address;

    when(mockedDefaultRepeaterServerOptions.uri).thenReturn(address);
    when(mockedDefaultRepeaterServerOptions.token).thenReturn('token');
    when(mockedDefaultRepeaterServerOptions.connectTimeout).thenReturn(10_00);
  });

  afterEach(() => {
    sut.disconnect();

    mockSocketServer.close();

    reset<DefaultRepeaterServerOptions | RepeaterCommands | Logger>(
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

      mockSocketServer.onConnection(socket => {
        socket.on('deploy', () => {
          socket.emit('deployed', event);
        });
      });

      const handler: RepeaterServerEventHandler<any> = jest.fn();

      sut.on(RepeaterServerEvents.DEPLOY, handler);

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

      sut.on(RepeaterServerEvents.DEPLOY, handler);

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

        sut.on(expected.event, handler);

        await sut.connect(RepeaterId);

        // act
        mockSocketServer.emit(input.event, input.data);

        // assert
        await setTimeout(200);
        expect(handler).toHaveBeenCalledWith(...expected.data);
      }
    );
  });

  describe('off', () => {
    it('should not invoke handler when it switched off', async () => {
      // arrange
      const event = { code: RepeaterErrorCodes.UNKNOWN_ERROR, message: 'msg' };

      const handler: RepeaterServerEventHandler<any> = jest.fn();

      sut.on(RepeaterServerEvents.ERROR, handler);

      await sut.connect(RepeaterId);

      sut.off(RepeaterServerEvents.ERROR, handler);

      // act
      mockSocketServer.emit(SocketEvents.ERROR, event);

      // assert
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
