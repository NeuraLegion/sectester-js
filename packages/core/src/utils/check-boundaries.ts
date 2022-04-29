import { isNumber } from './types';

export interface NumBoundaries {
  min?: number;
  max?: number;
  exclusiveMin?: boolean;
  exclusiveMax?: boolean;
}

type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

type MaxBoundary = WithRequiredProperty<
  Omit<NumBoundaries, 'min' | 'exclusiveMin'>,
  'max'
>;
type MinBoundary = WithRequiredProperty<
  Omit<NumBoundaries, 'max' | 'exclusiveMax'>,
  'min'
>;

const checkMinimum = (
  value: number,
  { min, exclusiveMin = false }: MinBoundary
): boolean => (exclusiveMin ? value > min : value >= min);

const checkMaximum = (
  value: number,
  { max, exclusiveMax = false }: MaxBoundary
): boolean => (exclusiveMax ? value < max : value <= max);

export const checkBoundaries = (
  value: unknown,
  { min, max, exclusiveMax, exclusiveMin }: NumBoundaries = {}
) => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }

  if (!isNumber(value)) {
    return false;
  }

  let valid = true;

  if (isNumber(max)) {
    valid = checkMaximum(value, { max, exclusiveMax });
  }

  if (valid && isNumber(min)) {
    valid = checkMinimum(value, { min, exclusiveMin });
  }

  return valid;
};
