import type { Report, ReportAnnotation } from '../types';

export interface ReportBuildResult {
  report: Report;
  annotations: ReportAnnotation[];
}

export interface ReportBuilder {
  build(): ReportBuildResult;
}
