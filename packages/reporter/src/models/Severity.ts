/* istanbul ignore file */

export enum Severity {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export function severityToNumber(s: Severity): number {
  switch (s) {
    case Severity.LOW:
      return 1;
    case Severity.MEDIUM:
      return 2;
    case Severity.HIGH:
      return 3;
    default:
      throw new Error('Unknown severity value');
  }
}

export function severityComparator(s1: Severity, s2: Severity): number {
  return severityToNumber(s2) - severityToNumber(s1);
}
