export const isJson = (text: string): boolean => {
  if (
    !(
      (text.startsWith('{') && text.endsWith('}')) ||
      (text.startsWith('[') && text.endsWith(']'))
    )
  ) {
    return false;
  }

  try {
    JSON.parse(text);

    return true;
  } catch {
    return false;
  }
};
