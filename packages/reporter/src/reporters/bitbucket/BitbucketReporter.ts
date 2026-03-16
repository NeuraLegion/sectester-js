import { Reporter } from '../../lib';
import { BITBUCKET_CLIENT, BitbucketClient } from './api';
import {
  SingleItemReportBuilder,
  MultiItemsReportBuilder,
  BaseReportBuilder
} from './builders';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { Report, ReportAnnotation } from './types';
import { JUnitReportBuilder, buildJUnitXML } from '../../junit';
import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';
import { writeFile } from 'node:fs/promises';

@injectable()
export class BitbucketReporter implements Reporter {
  constructor(
    @inject(BITBUCKET_CLIENT) private readonly bitbucketClient: BitbucketClient,
    @inject(TEST_FILE_PATH_RESOLVER)
    private readonly testFilePathResolver: TestFilePathResolver
  ) {}

  public async report(scan: Scan): Promise<void> {
    const issues = await scan.issues();
    if (issues.length === 0) return;

    const builder = this.createReportBuilder(issues);
    const { report, annotations } = builder.build();
    const reportId = builder.getReportId();

    await Promise.all([
      this.submitBitbucketReport(reportId, report, annotations),
      this.generateTestReport(issues)
    ]);
  }

  private async submitBitbucketReport(
    reportId: string,
    report: Report,
    annotations: ReportAnnotation[]
  ): Promise<void> {
    await this.bitbucketClient.createOrUpdateReport(reportId, report);
    await this.bitbucketClient.createAnnotations(reportId, annotations);
  }

  private async generateTestReport(issues: Issue[]): Promise<void> {
    const testFilePath = this.testFilePathResolver.getTestFilePath();
    const junitBuilder = new JUnitReportBuilder(issues, testFilePath);
    const testReport = junitBuilder.build();
    const reportXml = buildJUnitXML(testReport);
    const fileName = `bb-test-report-${crypto.randomUUID()}.xml`;

    await writeFile(fileName, reportXml, 'utf-8');
  }

  private createReportBuilder(issues: Issue[]): BaseReportBuilder {
    const testFilePath = this.testFilePathResolver.getTestFilePath();

    return issues.length === 1
      ? new SingleItemReportBuilder(issues[0], testFilePath)
      : new MultiItemsReportBuilder(issues, testFilePath);
  }
}
