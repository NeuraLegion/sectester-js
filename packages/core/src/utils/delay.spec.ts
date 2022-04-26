import { delay } from './delay';

describe('delay', () => {
  const findArg = <R>(
    args: [unknown, unknown],
    expected: 'function' | 'number'
  ): R => (typeof args[0] === expected ? args[0] : args[1]) as R;

  const useFakeTimers = () => {
    jest.useFakeTimers();

    const mockedImplementation = jest
      .spyOn(global, 'setTimeout')
      .getMockImplementation();

    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((...args: [unknown, unknown]) => {
        // ADHOC: depending on implementation (promisify vs raw), the method signature will be different
        const callback = findArg<(..._: unknown[]) => void>(args, 'function');
        const ms = findArg<number>(args, 'number');
        const timer = mockedImplementation?.(callback, ms);

        jest.runAllTimers();

        return timer as NodeJS.Timeout;
      });
  };

  beforeEach(() => useFakeTimers());

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  it('should schedule a timer', async () => {
    // arrange
    const input = 1;

    // act
    await delay(input);

    // assert
    expect(setTimeout).toHaveBeenCalledWith(input, expect.any(Function));
  });
});
