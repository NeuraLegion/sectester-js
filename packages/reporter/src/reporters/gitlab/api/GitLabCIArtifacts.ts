import type { CodeQualityReport } from '../types';
import type { JUnitTestSuites } from '../../../junit';

export interface GitLabCIArtifacts {
  writeCodeQualityReport(report: CodeQualityReport): Promise<void>;
  writeTestReport(report: JUnitTestSuites): Promise<void>;
}

export const GITLAB_CI_ARTIFACTS = Symbol('GITLAB_CI_ARTIFACTS');
