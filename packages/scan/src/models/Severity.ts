export enum Severity {
  MEDIUM = 'Medium',
  HIGH = 'High',
  LOW = 'Low'
}

export const severityRanges = new Map(
  Object.values(Severity).map(severity => {
    switch (severity) {
      case Severity.MEDIUM:
        return [severity, [Severity.MEDIUM, Severity.LOW]];
      case Severity.HIGH:
        return [severity, [Severity.HIGH]];
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
    default:
      throw new Error('Unknown severity value');
  }
}

export function severityComparator(s1: Severity, s2: Severity): number {
  return severityToNumber(s2) - severityToNumber(s1);
}
