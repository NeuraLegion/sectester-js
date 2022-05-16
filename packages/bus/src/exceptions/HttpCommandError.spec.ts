import { HttpCommandError } from './HttpCommandError';
import { AxiosError } from 'axios';

describe('HttpCommandError', () => {
  describe('constructor', () => {
    it.each([
      {
        input: { message: 'Something went wrong' },
        expected: { message: 'Something went wrong' }
      },
      {
        input: { response: { data: 'Something went wrong', status: 500 } },
        expected: { message: 'Something went wrong', status: 500 }
      },
      {
        input: { message: 'Timeout reached', code: 'ETIMEDOUT' },
        expected: { message: 'Timeout reached', code: 'ETIMEDOUT' }
      }
    ])(
      'should create an instance of error if $input is passed',
      ({ input, expected }) => {
        // act
        const result = new HttpCommandError(input as AxiosError);

        // assert
        expect(result).toMatchObject(expected);
      }
    );
  });
});
