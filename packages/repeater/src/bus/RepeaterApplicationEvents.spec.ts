import {
  ErrorHandlerFunction,
  RepeaterApplicationEvents
} from './RepeaterApplicationEvents';
import {
  RepeaterServerEventHandler,
  RepeaterServerEvents,
  RepeaterServerEventsMap
} from './RepeaterServer';
import { delay } from '@sectester/core';

describe('RepeaterApplicationEvents', () => {
  let sut: RepeaterApplicationEvents;

  beforeEach(() => {
    sut = new RepeaterApplicationEvents();
  });

  describe('emit', () => {
    it('should invoke handler after subscription', () => {
      // arrange
      const handler: RepeaterServerEventHandler<any> = jest.fn();
      const event = 'testEvent';

      sut.on(event as keyof RepeaterServerEventsMap, handler);

      // act
      sut.emit(event as RepeaterServerEvents, 'arg1', 'arg2');

      // assert
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should not invoke handler after removal', () => {
      // arrange
      const handler: RepeaterServerEventHandler<any> = jest.fn();
      const event = 'testEvent';

      sut.on(event as keyof RepeaterServerEventsMap, handler);
      sut.off(event as keyof RepeaterServerEventsMap, handler);

      // act
      sut.emit(event as RepeaterServerEvents, 'arg1', 'arg2');

      // Capture the arguments passed to the handler

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call the callback with the handler result', async () => {
      // arrange
      const handler: RepeaterServerEventHandler<any> = jest
        .fn()
        .mockResolvedValue('result');
      const callback = jest.fn();

      const event = 'testEvent';

      sut.on(event as keyof RepeaterServerEventsMap, handler);

      // act
      sut.emit(event as RepeaterServerEvents, 'arg1', 'arg2', callback);

      // assert
      await delay(200);
      expect(callback).toHaveBeenCalledWith('result');
    });

    it('should handle errors in event handlers', async () => {
      // arrange
      const error = new Error('test error');

      const errorHandlerMock: ErrorHandlerFunction = jest.fn();
      sut.onError = errorHandlerMock;

      const handler: RepeaterServerEventHandler<any> = jest
        .fn()
        .mockRejectedValue(error);
      const event = 'testEvent';

      sut.on(event as keyof RepeaterServerEventsMap, handler);

      // act
      sut.emit(event as RepeaterServerEvents, 'arg1', 'arg2');

      // assert
      await delay(200);

      expect(errorHandlerMock).toHaveBeenCalledWith(
        new Error('test error'),
        event,
        ['arg1', 'arg2']
      );
    });
  });
});
