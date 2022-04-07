import { first } from './first';
import { promisify } from 'util';

describe('first', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('should be resolved with an undefined if all resolved promises does not pass the test.', async () => {
    // arrange
    const input = [
      Promise.resolve(1),
      promisify(setTimeout)(100).then(() => 2),
      promisify(setTimeout)(200).then(() => 3)
    ];
    const predicate = jest.fn().mockReturnValue(false);
    jest.runAllTimers();

    // act
    const result = await first(input, predicate);

    // assert
    expect(result).toBeUndefined();
  });

  it('should be resolved with the result of first resolved promise that pass the test', async () => {
    // arrange
    const input = [
      promisify(setTimeout)(0).then(() => 1),
      promisify(setTimeout)(500).then(() => 2),
      promisify(setTimeout)(5000).then(() => 3)
    ];
    const predicate = jest.fn().mockImplementation((x: number) => x >= 2);
    jest.runAllTimers();

    // act
    const result = await first(input, predicate);

    // assert
    expect(result).toEqual(2);
  });

  it('should be resolved with an undefined if no promises', async () => {
    // arrange
    const predicate = jest.fn();
    jest.runAllTimers();

    // act
    const result = await first([], predicate);

    // assert
    expect(result).toBeUndefined();
  });

  it('should be rejected with an error if at least one of the promises is rejected', async () => {
    // arrange
    const expected = 'Something went wrong';
    const input = [
      Promise.reject(new Error(expected)),
      promisify(setTimeout)(0).then(() => 1),
      promisify(setTimeout)(100).then(() => 2)
    ];
    const predicate = jest.fn();
    jest.runAllTimers();

    // act
    const result = first(input, predicate);

    // assert
    return expect(result).rejects.toThrow(expected);
  });
});
