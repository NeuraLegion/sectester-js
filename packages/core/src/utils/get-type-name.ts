export const getTypeName = (payload: unknown) => {
  const { constructor } = Object.getPrototypeOf(payload);

  return constructor.name as string;
};
