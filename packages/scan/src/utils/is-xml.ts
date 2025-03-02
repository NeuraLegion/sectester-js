export const isXml = (text: string): boolean =>
  text.startsWith('<?xml') ||
  (text.startsWith('<') &&
    !text.startsWith('<!DOCTYPE html') &&
    !text.startsWith('<!--') &&
    (text.includes('</') || text.includes('/>')) &&
    text.endsWith('>'));
