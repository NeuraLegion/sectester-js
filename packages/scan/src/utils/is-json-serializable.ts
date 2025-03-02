export const isJsonSerializable = (data: unknown): boolean => {
  try {
    const serialized = JSON.stringify(data);
    // Check it's not just an empty object (which Maps/Sets would produce)
    if (
      serialized === '{}' &&
      Object.prototype.toString.call(data) !== '[object Object]'
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};
