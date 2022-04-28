export const escape = (
  str: string,
  chars: string = '^[]{}()\\\\.$*+?|'
): string => {
  const foundChar = [...chars].some(
    (_, i: number) => str.indexOf(chars.charAt(i)) !== -1
  );

  if (!foundChar) {
    return str;
  }

  let result = '';

  for (let j = 0; j < str.length; ++j) {
    if (chars.indexOf(str.charAt(j)) !== -1) {
      result += '\\';
    }

    result += str.charAt(j);
  }

  return result;
};
