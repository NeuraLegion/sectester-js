export interface GitLabConfig {
  codeQualityReportFilename: string;
}

export const GITLAB_CONFIG = Symbol('GITLAB_CONFIG');
