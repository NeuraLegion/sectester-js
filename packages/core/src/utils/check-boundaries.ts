import { isNumber } from './types';

export interface NumBoundaries {
  min?: number;
  max?: number;
  exclusiveMin?: boolean;
  exclusiveMax?: boolean;
}

const checkMinimum = (
  value: number,
  options: Omit<NumBoundaries, 'max' | 'exclusiveMax'> = {}
): boolean => {
  const exclusiveMin = !!options.exclusiveMin;
  const min = options.min ?? Number.MIN_SAFE_INTEGER;

  return exclusiveMin ? value > min : value >= min;
};

const checkMaximum = (
  value: number,
  options: Omit<NumBoundaries, 'min' | 'exclusiveMin'> = {}
): boolean => {
  const exclusiveMax = !!options.exclusiveMax;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  return exclusiveMax ? value < max : value <= max;
};

export const checkBoundaries = (
  value: unknown,
  options: {
    min?: number;
    max?: number;
    exclusiveMin?: boolean;
    exclusiveMax?: boolean;
  } = {}
) => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }

  if (!isNumber(value)) {
    return false;
  }

  let valid = true;

  if (isNumber(options.max)) {
    valid = checkMaximum(value, options);
  }

  if (valid && isNumber(options.min)) {
    valid = checkMinimum(value, options);
  }

  return valid;
};
