import { Message } from './Message';

class TestMessage extends Message<string> {
  constructor(
    payload: string,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, type, correlationId, createdAt);
  }
}

describe('Message', () => {
  describe('constructor', () => {
    it('should set default values to props', () => {
      // arrange
      const payload = 'Test';

      // act
      const event = new TestMessage(payload);

      // assert
      expect(event).toMatchObject({
        payload,
        type: 'TestMessage',
        createdAt: expect.any(Date),
        correlationId: expect.any(String)
      });
    });

    it('should override default values', () => {
      // arrange
      const payload = 'Test';
      const type = 'SomeMessage';
      const correlationId = 'random';
      const createdAt = new Date(0);

      // act
      const event = new TestMessage(payload, type, correlationId, createdAt);

      // assert
      expect(event).toMatchObject({
        payload,
        type,
        createdAt,
        correlationId
      });
    });
  });
});
