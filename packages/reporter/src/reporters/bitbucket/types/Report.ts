export type ReportType = 'SECURITY' | 'COVERAGE' | 'TEST' | 'BUG';

export type ReportResult = 'PASSED' | 'FAILED' | 'PENDING';

export type ReportDataType =
  | 'BOOLEAN'
  | 'DATE'
  | 'DURATION'
  | 'LINK'
  | 'NUMBER'
  | 'PERCENTAGE'
  | 'TEXT';

export interface ReportDataLink {
  text: string;
  href: string;
}

export interface ReportData {
  title: string;
  type?: ReportDataType;
  value: boolean | number | string | ReportDataLink;
}

export interface Report {
  title: string;
  details?: string;
  external_id?: string;
  reporter?: string;
  link?: string;
  remote_link_enabled?: boolean;
  logo_url?: string;
  report_type?: ReportType;
  result?: ReportResult;
  data?: ReportData[];
}
