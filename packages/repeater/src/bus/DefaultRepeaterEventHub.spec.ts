import { DefaultRepeaterEventHub } from './DefaultRepeaterEventHub';
import {
  ErrorHandlerFunction,
  RepeaterServerEventHandler,
  RepeaterServerEvents,
  RepeaterServerEventsMap
} from './RepeaterEventHub';
import { delay } from '@sectester/core';

describe('DefaultRepeaterEventHub', () => {
  let sut: DefaultRepeaterEventHub;

  beforeEach(() => {
    sut = new DefaultRepeaterEventHub();
  });

  describe('on', () => {
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
  });

  describe('off', () => {
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
  });

  describe('removeAllListeners', () => {
    it('should not invoke handler after removing all listeners', () => {
      // arrange
      const handler: RepeaterServerEventHandler<any> = jest.fn();
      const event = 'testEvent';

      sut.on(event as keyof RepeaterServerEventsMap, handler);
      sut.removeAllListeners();

      // act
      sut.emit(event as RepeaterServerEvents, 'arg1', 'arg2');

      // Capture the arguments passed to the handler

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
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
  });

  describe('errorHandler', () => {
    it('should handle errors in event handlers', async () => {
      // arrange
      const error = new Error('test error');

      const errorHandlerMock: ErrorHandlerFunction = jest.fn();
      sut.errorHandler = errorHandlerMock;

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
