import type { Report, ReportAnnotation } from '../types';

export interface BitbucketClient {
  createOrUpdateReport(reportId: string, report: Report): Promise<void>;
  createAnnotations(
    reportId: string,
    annotations: ReportAnnotation[]
  ): Promise<void>;
}

export const BITBUCKET_CLIENT = Symbol('BITBUCKET_CLIENT');
