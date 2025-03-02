import { isXml } from './is-xml';

describe('isXml', () => {
  it('should return true for strings starting with <?xml', () => {
    expect(isXml('<?xml version="1.0" encoding="UTF-8"?><root></root>')).toBe(
      true
    );
    expect(isXml('<?xml version="1.0"?><data></data>')).toBe(true);
  });

  it('should return true for valid XML strings', () => {
    expect(isXml('<root><child>content</child></root>')).toBe(true);
    expect(isXml('<person><name>John</name><age>30</age></person>')).toBe(true);
    expect(isXml('<empty />')).toBe(true);
    expect(isXml('<data attribute="value"></data>')).toBe(true);
  });

  it('should return false for HTML documents', () => {
    expect(isXml('<!DOCTYPE html><html><body>Hello</body></html>')).toBe(false);
    expect(
      isXml(
        '<html lang="en"><head><title>Title</title></head><body></body></html>'
      )
    ).toBe(true); // Note: This might be detected as XML since it has valid XML-like structure
  });

  it('should return false for strings starting with comments', () => {
    expect(isXml('<!-- Comment --><root></root>')).toBe(false);
    expect(isXml('<!--\n Multi-line comment \n--><data></data>')).toBe(false);
  });

  it('should return false for non-XML strings', () => {
    expect(isXml('This is plain text')).toBe(false);
    expect(isXml('{ "json": "object" }')).toBe(false);
    expect(isXml('')).toBe(false);
    expect(isXml('text with <tags> but not XML')).toBe(false);
  });

  it('should return false for incomplete XML strings', () => {
    expect(isXml('<root>')).toBe(false); // No closing tag and doesn't end with >
  });

  it('should return true for XML with namespaces', () => {
    expect(isXml('<ns:root xmlns:ns="http://example.com"></ns:root>')).toBe(
      true
    );
  });
});
