import 'reflect-metadata';
import { Logger, LogLevel } from './Logger';

const logLevels = [
  LogLevel.VERBOSE,
  LogLevel.NOTICE,
  LogLevel.WARN,
  LogLevel.ERROR,
  LogLevel.SILENT
];

type LogLevelMethodName = 'debug' | 'log' | 'warn' | 'error';

const getLogLevelMethodName = (
  logLevel: LogLevel
): LogLevelMethodName | undefined => {
  switch (logLevel) {
    case LogLevel.VERBOSE:
      return 'debug';
    case LogLevel.NOTICE:
      return 'log';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
      return 'error';
    default:
      return undefined;
  }
};

const getLogLevelName = (logLevel: LogLevel): string => LogLevel[logLevel];

const checkIfMethodExists = (
  val: [LogLevel, LogLevelMethodName | undefined]
): val is [LogLevel, LogLevelMethodName] => !!val[1];

const convertToKeyAndValuePairs = (levels: LogLevel[]) =>
  levels.map(level => ({ level, name: getLogLevelName(level) }));

describe('Logger', () => {
  const mockedConsole = jest.spyOn(console, 'log');

  afterEach(() => jest.resetAllMocks());

  describe('constructor', () => {
    it('should set a level to NOTICE by default', () => {
      const logger = new Logger();

      expect(logger.logLevel).toEqual(LogLevel.NOTICE);
    });

    it('should set a custom level', () => {
      const logger = new Logger(LogLevel.ERROR);

      expect(logger.logLevel).toEqual(LogLevel.ERROR);
    });
  });

  describe('logLevel', () => {
    it('should change a default level', () => {
      const logger = new Logger();

      logger.logLevel = LogLevel.WARN;

      expect(logger.logLevel).toEqual(LogLevel.WARN);
    });
  });

  const methods = logLevels
    .map(
      x =>
        [x, getLogLevelMethodName(x)] as [
          LogLevel,
          LogLevelMethodName | undefined
        ]
    )
    .filter<[LogLevel, LogLevelMethodName]>(checkIfMethodExists)
    .map(([level, methodName]: [LogLevel, LogLevelMethodName]) => ({
      methodName,
      displayWhen: logLevels.filter(x => x >= level)
    }));

  describe.each(methods)('$methodName', ({ methodName, displayWhen }) => {
    let logger!: Logger;

    beforeEach(() => {
      logger = new Logger();
    });

    it.each(convertToKeyAndValuePairs(displayWhen))(
      'should log a message if level is $name',
      ({ level }) => {
        logger.logLevel = level;

        logger[methodName](methodName);

        expect(mockedConsole).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`${methodName}$`))
        );
      }
    );

    it.each(
      convertToKeyAndValuePairs(logLevels.filter(x => !displayWhen.includes(x)))
    )('should not log a message if level is $name', ({ level }) => {
      logger.logLevel = level;

      logger[methodName](methodName);

      expect(mockedConsole).not.toHaveBeenCalled();
    });
  });
});
