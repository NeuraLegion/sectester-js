import { escape } from './escape';

describe('escape', () => {
  it('should escape new lines', () => {
    expect(escape('\n')).toBe('%0A');
  });

  it('should escape carriage returns', () => {
    expect(escape('\r')).toBe('%0D');
  });

  it('should escape double quotes', () => {
    expect(escape('"')).toBe('%22');
  });

  it('should escape all special characters', () => {
    expect(escape('\n\r"')).toBe('%0A%0D%22');
  });
});
