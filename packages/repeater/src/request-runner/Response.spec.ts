import { Response } from './Response';
import { Protocol } from '../models';

describe('Response', () => {
  describe('constructor', () => {
    it('should create an instance having only protocol', () => {
      const responseOptions = {
        protocol: Protocol.WS
      };

      const response = new Response(responseOptions);

      const { protocol, statusCode, headers, body, message, errorCode } =
        response;
      expect({
        protocol,
        statusCode,
        headers,
        body,
        message,
        errorCode
      }).toEqual(responseOptions);
    });

    it('should create an instance with full fieldset', () => {
      const responseOptions = {
        protocol: Protocol.WS,
        statusCode: 200,
        headers: { 'x-key': ['x-value'] },
        body: '{}',
        message: 'OK',
        errorCode: 'NO_ERROR'
      };

      const response = new Response(responseOptions);

      const { protocol, statusCode, headers, body, message, errorCode } =
        response;
      expect({
        protocol,
        statusCode,
        headers,
        body,
        message,
        errorCode
      }).toEqual(responseOptions);
    });
  });
});
