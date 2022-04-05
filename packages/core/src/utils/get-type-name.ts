type GetTypeName = {
  (type: undefined | null): undefined;
  (type: NonNullable<unknown>): string;
};

export const getTypeName: GetTypeName = (payload: unknown) => {
  const { constructor } = Object.getPrototypeOf(payload);

  return constructor?.name;
};
