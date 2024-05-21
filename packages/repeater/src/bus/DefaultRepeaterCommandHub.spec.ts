import { DefaultRepeaterCommandHub } from './DefaultRepeaterCommandHub';
import { Protocol } from '../models/Protocol';
import { RequestRunner, Request, Response } from '../request-runner';
import { instance, mock, reset, when } from 'ts-mockito';

describe('DefaultRepeaterCommandHub', () => {
  let sut!: DefaultRepeaterCommandHub;

  const mockedRequestRunner = mock<RequestRunner>();

  beforeEach(() => {
    sut = new DefaultRepeaterCommandHub([instance(mockedRequestRunner)]);
  });

  afterEach(() => reset<RequestRunner>(mockedRequestRunner));

  describe('sendRequest', () => {
    it('should send', async () => {
      // arrange
      const request = new Request({
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        method: 'GET'
      });

      const response = new Response({
        protocol: Protocol.HTTP,
        statusCode: 200
      });

      when(mockedRequestRunner.protocol).thenReturn(Protocol.HTTP);
      when(mockedRequestRunner.run(request)).thenResolve(response);

      // act
      const result = await sut.sendRequest(request);

      // assert
      expect(result).toEqual(response);
    });

    it('should throw when there are no suitable protocol handler', async () => {
      // arrange
      const request = new Request({
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        method: 'GET'
      });

      when(mockedRequestRunner.protocol).thenReturn(
        'someOtherProtocol' as Protocol
      );

      // act
      const act = () => sut.sendRequest(request);

      // assert
      await expect(act).rejects.toThrow(
        `Unsupported protocol "${Protocol.HTTP}"`
      );
    });
  });
});
