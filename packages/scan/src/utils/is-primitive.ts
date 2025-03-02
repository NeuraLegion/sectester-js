export const isPrimitive = (value: unknown): boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  value === null ||
  value === undefined;
