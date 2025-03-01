export interface NumBoundaries {
  min?: number;
  max?: number;
  exclusiveMin?: boolean;
  exclusiveMax?: boolean;
}

type WithRequiredProperty<T, K extends keyof T> = T & Required<Pick<T, K>>;

const checkMinimum = (
  value: number,
  {
    min,
    exclusiveMin = false
  }: WithRequiredProperty<Pick<NumBoundaries, 'min' | 'exclusiveMin'>, 'min'>
): boolean => (exclusiveMin ? value > min : value >= min);

const checkMaximum = (
  value: number,
  {
    max,
    exclusiveMax = false
  }: WithRequiredProperty<Pick<NumBoundaries, 'max' | 'exclusiveMax'>, 'max'>
): boolean => (exclusiveMax ? value < max : value <= max);

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

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
