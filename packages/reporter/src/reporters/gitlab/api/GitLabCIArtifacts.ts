import type { CodeQualityReport } from '../types';

export interface GitLabCIArtifacts {
  writeCodeQualityReport(report: CodeQualityReport): Promise<void>;
}

export const GITLAB_CI_ARTIFACTS = Symbol('GITLAB_CI_ARTIFACTS');
