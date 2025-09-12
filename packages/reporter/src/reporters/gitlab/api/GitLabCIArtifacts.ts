import type { CodeQualityReport, TestReport } from '../types';

export interface GitLabCIArtifacts {
  writeCodeQualityReport(report: CodeQualityReport): Promise<void>;
  writeTestReport(report: TestReport): Promise<void>;
}

export const GITLAB_CI_ARTIFACTS = Symbol('GITLAB_CI_ARTIFACTS');
