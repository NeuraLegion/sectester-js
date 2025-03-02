export const normalizeLinefeeds = (value: string) =>
  value.replace(/\r?\n|\r/g, '\r\n');
