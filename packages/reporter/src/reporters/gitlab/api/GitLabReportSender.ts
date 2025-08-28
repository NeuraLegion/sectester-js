import type { CodeQualityReport } from '../types';

export interface GitLabReportSender {
  sendCodeQualityReport(report: CodeQualityReport): Promise<void>;
}

export const GITLAB_REPORT_SENDER = Symbol('GITLAB_REPORT_SENDER');
