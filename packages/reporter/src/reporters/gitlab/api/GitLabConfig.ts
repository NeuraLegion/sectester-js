export type GitLabReportFormat = 'code-quality' | 'test' | 'both';

export interface GitLabConfig {
  codeQualityReportFilename: string;
  testReportFilename: string;
  reportFormat?: GitLabReportFormat;
}

export const GITLAB_CONFIG = Symbol('GITLAB_CONFIG');
