export enum Severity {
  CRITICAL = 'Critical',
  MEDIUM = 'Medium',
  HIGH = 'High',
  LOW = 'Low'
}

export const severityRanges = new Map(
  Object.values(Severity).map(severity => {
    switch (severity) {
      case Severity.MEDIUM:
        return [severity, [Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL]];
      case Severity.HIGH:
        return [severity, [Severity.HIGH, Severity.CRITICAL]];
      case Severity.CRITICAL:
        return [severity, [Severity.CRITICAL]];
      case Severity.LOW:
        return [severity, Object.values(Severity)];
    }
  })
);

export function severityToNumber(s: Severity): number {
  switch (s) {
    case Severity.LOW:
      return 1;
    case Severity.MEDIUM:
      return 2;
    case Severity.HIGH:
      return 3;
    case Severity.CRITICAL:
      return 4;
    default:
      throw new Error('Unknown severity value');
  }
}

export function severityComparator(s1: Severity, s2: Severity): number {
  return severityToNumber(s2) - severityToNumber(s1);
}
