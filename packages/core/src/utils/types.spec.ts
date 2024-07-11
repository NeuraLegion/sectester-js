import {
  isBoolean,
  isDate,
  isFormData,
  isNumber,
  isObject,
  isPresent,
  isStream,
  isString,
  isURLSearchParams
} from './types';
// eslint-disable-next-line @typescript-eslint/naming-convention
import FormData from 'form-data';
import { Readable, Writable } from 'stream';

describe('types', () => {
  describe('isNumber', () => {
    it.each([
      {
        input: 'number',
        expected: false
      },
      {
        input: '20',
        expected: false
      },
      {
        input: NaN,
        expected: false
      },
      {
        input: 10,
        expected: true
      },
      {
        input: Number.MAX_SAFE_INTEGER,
        expected: true
      },
      {
        input: Number.MAX_VALUE,
        expected: true
      },
      {
        input: Number.MIN_VALUE,
        expected: true
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isNumber(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isString', () => {
    it.each([
      {
        input: 'number',
        expected: true
      },
      {
        input: '20',
        expected: true
      },
      {
        input: NaN,
        expected: false
      },
      {
        input: 10,
        expected: false
      },
      {
        input: Symbol('foo'),
        expected: false
      },
      {
        input: { foo: 'bar' },
        expected: false
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isString(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isBoolean', () => {
    it.each([
      {
        input: '',
        expected: false
      },
      {
        input: '0',
        expected: false
      },
      {
        input: NaN,
        expected: false
      },
      {
        input: 0,
        expected: false
      },
      {
        input: Symbol(''),
        expected: false
      },
      {
        input: {},
        expected: false
      },
      {
        input: [],
        expected: false
      },
      {
        input: true,
        expected: true
      },
      {
        input: false,
        expected: true
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isBoolean(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isStream', () => {
    it.each([
      {
        input: Readable.from('test'),
        expected: true
      },
      {
        input: new Writable(),
        expected: true
      },
      {
        input: {},
        expected: false
      },
      {
        input: [],
        expected: false
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isStream(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isDate', () => {
    it.each([
      {
        input: 'test',
        expected: false
      },
      {
        input: 0,
        expected: false
      },
      {
        input: NaN,
        expected: false
      },

      {
        input: new Date(),
        expected: true
      },
      {
        input: new Date(0),
        expected: true
      },
      {
        input: new Date('invalid'),
        expected: true
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isDate(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isURLSearchParams', () => {
    it.each([
      {
        input: 'test',
        expected: false
      },
      {
        input: new URLSearchParams(),
        expected: true
      },
      {
        input: {},
        expected: false
      },
      {
        input: [],
        expected: false
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isURLSearchParams(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isObject', () => {
    it.each([
      {
        input: 'test',
        expected: false
      },
      {
        input: Symbol(''),
        expected: false
      },
      {
        input: new Date(),
        expected: true
      },
      {
        input: {},
        expected: true
      },
      {
        input: [],
        expected: true
      },
      {
        input: undefined,
        expected: false
      },
      {
        input: null,
        expected: false
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isObject(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isFormData', () => {
    it.each([
      {
        input: 'test',
        expected: false
      },
      {
        input: new FormData(),
        expected: true
      },
      {
        input: {},
        expected: false
      },
      {
        input: [],
        expected: false
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isFormData(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });

  describe('isPresent', () => {
    it.each([
      {
        input: '',
        expected: true
      },
      {
        input: 0,
        expected: true
      },
      {
        input: NaN,
        expected: true
      },
      {
        input: {},
        expected: true
      },
      {
        input: [],
        expected: true
      },
      {
        input: undefined,
        expected: false
      },
      {
        input: null,
        expected: false
      }
    ])('should return $expected for $input', ({ input, expected }) => {
      // act
      const result = isPresent(input);

      // arrange
      expect(result).toEqual(expected);
    });
  });
});
