import { Response } from './Response';
import { Protocol } from '../models';

describe('Response', () => {
  it('should be possible to create response having only protocol', () => {
    const responseOptions = {
      protocol: Protocol.WS
    };

    const response = new Response(responseOptions);

    const { protocol, statusCode, headers, body, message, errorCode } =
      response;
    expect({ protocol, statusCode, headers, body, message, errorCode }).toEqual(
      responseOptions
    );
  });

  it('should be possible create response with full fieldset', () => {
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
    expect({ protocol, statusCode, headers, body, message, errorCode }).toEqual(
      responseOptions
    );
  });
});
