export const contains = <T>(enumType: Record<string, T>, value: T | T[]) =>
  (Array.isArray(value) ? value : [value]).every((x: T) =>
    Object.values(enumType).includes(x)
  );
