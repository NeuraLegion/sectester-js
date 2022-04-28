import FormData from 'form-data';

export const isPresent = <T>(value: T): value is NonNullable<T> =>
  value !== null && value !== undefined;

export const isObject = (value: unknown): value is object =>
  isPresent(value) && typeof value === 'object';

export const isDate = (value: unknown): value is Date => value instanceof Date;

export const isString = (value: unknown): value is string =>
  typeof value === 'string';

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value);

export const isURLSearchParams = (value: unknown): value is URLSearchParams =>
  value instanceof URLSearchParams;

export const isFormData = (value: unknown): value is FormData =>
  value instanceof FormData;
