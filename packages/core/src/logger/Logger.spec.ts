import { Logger, LogLevel } from './Logger';
import { anyString, anything, reset, spy, verify, when } from 'ts-mockito';

const logLevels = [
  LogLevel.VERBOSE,
  LogLevel.NOTICE,
  LogLevel.WARN,
  LogLevel.ERROR,
  LogLevel.SILENT
];

const getLogLevelMethodName = (
  logLevel: LogLevel
): 'debug' | 'log' | 'warn' | 'error' | undefined => {
  switch (logLevel) {
    case LogLevel.VERBOSE:
      return 'debug';
    case LogLevel.NOTICE:
      return 'log';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
      return 'error';
  }

  return undefined;
};

const getLogLevelName = (logLevel: LogLevel): string => {
  switch (logLevel) {
    case LogLevel.VERBOSE:
      return 'VERBOSE';
    case LogLevel.NOTICE:
      return 'NOTICE';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    case LogLevel.SILENT:
      return 'SILENT';
  }
};

describe('Logger', () => {
  describe('level config', () => {
    it('default level is NOTICE', () => {
      const logger = new Logger();
      expect(logger.logLevel).toEqual(LogLevel.NOTICE);
    });

    it('level can be set via contructor', () => {
      const logger = new Logger(LogLevel.ERROR);
      expect(logger.logLevel).toEqual(LogLevel.ERROR);
    });

    it('level can be changed via setter', () => {
      const logger = new Logger();
      logger.logLevel = LogLevel.WARN;
      expect(logger.logLevel).toEqual(LogLevel.WARN);
    });
  });

  describe('logging', () => {
    let logger!: Logger;
    let mockedConsole!: Console;
    const loggedMessages: string[] = [];

    beforeEach(() => {
      logger = new Logger();
      mockedConsole = spy(console);

      when(mockedConsole.log(anything())).thenCall((...args: any[]) => {
        loggedMessages.push(args[0]);
      });
    });

    afterEach(() => {
      reset(mockedConsole);
      logger = undefined as unknown as Logger;
      loggedMessages.splice(0);
    });

    describe.each(
      logLevels.map(item => ({ level: item, levelName: getLogLevelName(item) }))
    )('$levelName level', ({ level }) => {
      beforeEach(() => {
        logger.logLevel = level;
      });

      const loggerMethods = logLevels
        .map(item => ({ level: item, methodName: getLogLevelMethodName(item) }))
        .filter(item => item.methodName);

      const inactiveMethods = loggerMethods.filter(
        item => logLevels.indexOf(item.level) < logLevels.indexOf(level)
      ) as { methodName: string }[];
      if (inactiveMethods.length) {
        it.each(inactiveMethods)(
          'should not log .$methodName() messages',
          ({ methodName }) => {
            logger[methodName](methodName);

            verify(mockedConsole.log(anything())).never();
            expect(loggedMessages.length).toBe(0);
          }
        );
      }

      const activeMethods = loggerMethods.filter(
        item => logLevels.indexOf(item.level) >= logLevels.indexOf(level)
      ) as { methodName: string }[];
      if (activeMethods.length) {
        it.each(activeMethods)(
          'should log .$methodName() messages',
          ({ methodName }) => {
            logger[methodName](methodName);

            verify(mockedConsole.log(anyString())).once();
            expect(loggedMessages[0]).toMatch(new RegExp(`${methodName}$`));
          }
        );
      }
    });
  });
});
