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
