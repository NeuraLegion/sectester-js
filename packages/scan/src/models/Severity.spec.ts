import { Severity, severityComparator, severityToNumber } from './Severity';

describe('Severity', () => {
  describe('severityComparator', () => {
    it.each(
      [
        { input: { a: Severity.LOW, b: Severity.LOW }, expected: 0 },
        { input: { a: Severity.MEDIUM, b: Severity.MEDIUM }, expected: 0 },
        { input: { a: Severity.HIGH, b: Severity.HIGH }, expected: 0 },
        { input: { a: Severity.CRITICAL, b: Severity.CRITICAL }, expected: 0 },
        { input: { a: Severity.CRITICAL, b: Severity.HIGH }, expected: -1 },
        { input: { a: Severity.CRITICAL, b: Severity.MEDIUM }, expected: -1 },
        { input: { a: Severity.CRITICAL, b: Severity.LOW }, expected: -1 },
        { input: { a: Severity.HIGH, b: Severity.LOW }, expected: -1 },
        { input: { a: Severity.HIGH, b: Severity.MEDIUM }, expected: -1 },
        { input: { a: Severity.LOW, b: Severity.HIGH }, expected: 1 },
        { input: { a: Severity.MEDIUM, b: Severity.HIGH }, expected: 1 },
        { input: { a: Severity.MEDIUM, b: Severity.LOW }, expected: -1 },
        { input: { a: Severity.LOW, b: Severity.MEDIUM }, expected: 1 }
      ].map(item => ({
        ...item,
        expectedLabel:
          item.expected === 0
            ? 'zero'
            : item.expected > 0
            ? 'positive'
            : 'negative'
      }))
    )(
      'should return $expectedLabel comparing $input.a and $input.b',
      ({ input, expected }) => {
        // act
        const result = severityComparator(input.a, input.b);

        // assert
        expect(Math.sign(result)).toBe(expected);
      }
    );
  });

  describe('severityToNumber', () => {
    it.each([
      { input: Severity.LOW, expected: 1 },
      { input: Severity.MEDIUM, expected: 2 },
      { input: Severity.HIGH, expected: 3 },
      { input: Severity.CRITICAL, expected: 4 }
    ])(
      'should return a number representation for $input',
      ({ input, expected }) => {
        // act
        const result = severityToNumber(input);

        // assert
        expect(result).toEqual(expected);
      }
    );

    it('should raise an error if supplied input is invalid', () => {
      const input = 'Invalid';

      // act & assert
      expect(() => severityToNumber(input as unknown as Severity)).toThrow(
        'Unknown severity value'
      );
    });
  });
});
