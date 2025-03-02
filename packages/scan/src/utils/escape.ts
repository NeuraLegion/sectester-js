export const escape = (str: string) =>
  str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22');
