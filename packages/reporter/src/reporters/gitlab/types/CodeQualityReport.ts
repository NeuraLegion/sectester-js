export interface CodeQualityIssue {
  description: string;
  check_name: string;
  raw_details: string;
  fingerprint: string;
  severity: CodeQualitySeverity;
  location: {
    path: string;
    lines: {
      begin: number;
      end?: number;
    };
  };
}

export type CodeQualityReport = CodeQualityIssue[];
export type CodeQualitySeverity =
  | 'info'
  | 'minor'
  | 'major'
  | 'critical'
  | 'blocker';
