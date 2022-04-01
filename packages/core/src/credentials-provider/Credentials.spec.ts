import { Credentials } from './Credentials';

describe('Credentials', () => {
  describe('constructor', () => {
    it('should throw an error if token is invalid', () => {
      // arrange
      const token = 'qwerty';

      // act / assert
      expect(() => new Credentials({ token })).toThrow(
        'Unable to recognize the API key'
      );
    });

    it('should throw an error if token is not defined', () => {
      // arrange
      const token = '';

      // act / assert
      expect(() => new Credentials({ token })).toThrow('Provide an API key');
    });

    it.each([
      'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0',
      'w0iikzf.nexp.aeish9lhiag7ledmsdwpwcbilagupc3r',
      '0zmcwpe.nexr.0vlon8mp7lvxzjuvgjy88olrhadhiukk'
    ])('should set token', (token: string) => {
      // act
      const result = new Credentials({ token });

      // act / assert
      expect(result).toMatchObject({ token });
    });
  });
});
