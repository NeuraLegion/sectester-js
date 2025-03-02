import { isPrimitive } from './is-primitive';

describe('isPrimitive', () => {
  describe('when checking primitive values', () => {
    it('should return true for string', () => {
      expect(isPrimitive('')).toBe(true);
      expect(isPrimitive('hello')).toBe(true);
    });

    it('should return true for number', () => {
      expect(isPrimitive(0)).toBe(true);
      expect(isPrimitive(42)).toBe(true);
      expect(isPrimitive(NaN)).toBe(true);
      expect(isPrimitive(Infinity)).toBe(true);
    });

    it('should return true for boolean', () => {
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(false)).toBe(true);
    });

    it('should return true for null', () => {
      expect(isPrimitive(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isPrimitive(undefined)).toBe(true);
    });
  });

  describe('when checking non-primitive values', () => {
    it('should return false for objects', () => {
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive({ a: 1 })).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isPrimitive([])).toBe(false);
      expect(isPrimitive([1, 2, 3])).toBe(false);
    });

    it('should return false for functions', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isPrimitive(() => {})).toBe(false);
      // eslint-disable-next-line prefer-arrow-callback, @typescript-eslint/no-empty-function
      expect(isPrimitive(function () {})).toBe(false);
    });

    it('should return false for Date objects', () => {
      expect(isPrimitive(new Date())).toBe(false);
    });

    it('should return false for RegExp objects', () => {
      expect(isPrimitive(/test/)).toBe(false);
      expect(isPrimitive(new RegExp('test'))).toBe(false);
    });

    it('should return false for Map and Set objects', () => {
      expect(isPrimitive(new Map())).toBe(false);
      expect(isPrimitive(new Set())).toBe(false);
    });
  });
});
