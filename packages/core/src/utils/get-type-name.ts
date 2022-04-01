export const getTypeName = (payload: unknown): string => {
  const { constructor } = Object.getPrototypeOf(payload);

  return constructor.name;
};
