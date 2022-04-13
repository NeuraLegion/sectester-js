import { HttpCommand, HttpOptions } from './HttpCommand';
import { Method } from 'axios';

describe('HttpCommand', () => {
  describe('constructor', () => {
    it('should set default values to props', () => {
      // arrange
      const options: HttpOptions<string> = {
        payload: 'Test',
        url: '/api/test',
        method: 'GET'
      };

      // act
      const command = new HttpCommand(options);

      // assert
      expect(command).toMatchObject({
        ttl: 10000,
        expectReply: true,
        type: 'HttpCommand',
        createdAt: expect.any(Date),
        correlationId: expect.any(String)
      });
    });

    it('should set GET to method by default', () => {
      // arrange
      const options: HttpOptions<string> = {
        payload: 'Test',
        url: '/api/test'
      };

      // act
      const command = new HttpCommand(options);

      // assert
      expect(command).toMatchObject({
        method: 'GET'
      });
    });

    it('should raise an exception if method is not string', () => {
      // arrange
      const options = {
        payload: 'Test',
        url: '/api/test',
        method: 0 as unknown as Method
      };

      // act / assert
      expect(() => new HttpCommand(options)).toThrow('`method` must be string');
    });

    it('should raise an exception if url is not string', () => {
      // arrange
      const options = { payload: 'Test', url: 0 as unknown as string };

      // assert
      expect(() => new HttpCommand(options)).toThrow('`url` must be string');
    });
  });
});
