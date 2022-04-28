/* istanbul ignore file */

export const escape = (
  str: string,
  chars: string = '^[]{}()\\\\.$*+?|'
): string => {
  let foundChar = false;

  const length = chars.length;

  for (let i = 0; i < length; ++i) {
    if (str.indexOf(chars.charAt(i)) !== -1) {
      foundChar = true;
      break;
    }
  }

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
