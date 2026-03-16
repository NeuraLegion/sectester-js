import 'reflect-metadata';
import { MultiItemsReportBuilder } from './MultiItemsReportBuilder';
import { HttpMethod, Issue, Severity } from '@sectester/scan';

describe('MultiItemsReportBuilder', () => {
  const createIssue = (severity: Severity): Issue => ({
    name: `Test Issue ${crypto.randomUUID()} with ${severity} severity`,
    severity,
    id: crypto.randomUUID(),
    entryPointId: crypto.randomUUID(),
    certainty: true,
    details: `Test details for ${severity} issue`,
    remedy: 'Fix it',
    protocol: 'http',
    cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    time: new Date(),
    originalRequest: {
      method: HttpMethod.GET,
      url: 'https://example.com/api/test'
    },
    request: {
      method: HttpMethod.GET,
      url: 'https://example.com/api/test'
    },
    link: `https://app.brightsec.com/scan/${crypto.randomUUID()}`
  });

  it('should build report with multiple issues of different severities', () => {
    const issues = [
      createIssue(Severity.CRITICAL),
      createIssue(Severity.HIGH),
      createIssue(Severity.MEDIUM),
      createIssue(Severity.LOW)
    ];

    const builder = new MultiItemsReportBuilder(issues, 'test.spec.ts');
    const { report, annotations } = builder.build();

    expect(report).toEqual({
      title: `SecTester (${issues.length} issues)`,
      details: `SecTester found ${issues.length} issues`,
      reporter: 'SecTester',
      report_type: 'SECURITY',
      result: 'FAILED',
      data: [
        { title: 'Total Issues', type: 'NUMBER', value: issues.length },
        { title: 'Critical', type: 'NUMBER', value: 1 },
        { title: 'High', type: 'NUMBER', value: 1 },
        { title: 'Medium', type: 'NUMBER', value: 1 },
        { title: 'Low', type: 'NUMBER', value: 1 }
      ]
    });

    expect(annotations).toEqual([
      {
        details: issues[0].details,
        link: issues[0].link,
        title: issues[0].name,
        external_id: issues[0].id,
        annotation_type: 'VULNERABILITY',
        summary: `${issues[0].name} vulnerability found at ${issues[0].originalRequest.method} ${issues[0].originalRequest.url}`,
        result: 'FAILED',
        severity: 'CRITICAL',
        path: 'test.spec.ts',
        line: 1
      },
      {
        details: issues[1].details,
        link: issues[1].link,
        title: issues[1].name,
        external_id: issues[1].id,
        annotation_type: 'VULNERABILITY',
        summary: `${issues[1].name} vulnerability found at ${issues[1].originalRequest.method} ${issues[1].originalRequest.url}`,
        result: 'FAILED',
        severity: 'HIGH',
        path: 'test.spec.ts',
        line: 1
      },
      {
        details: issues[2].details,
        link: issues[2].link,
        title: issues[2].name,
        external_id: issues[2].id,
        annotation_type: 'VULNERABILITY',
        summary: `${issues[2].name} vulnerability found at ${issues[2].originalRequest.method} ${issues[2].originalRequest.url}`,
        result: 'FAILED',
        severity: 'MEDIUM',
        path: 'test.spec.ts',
        line: 1
      },
      {
        details: issues[3].details,
        link: issues[3].link,
        title: issues[3].name,
        external_id: issues[3].id,
        annotation_type: 'VULNERABILITY',
        summary: `${issues[3].name} vulnerability found at ${issues[3].originalRequest.method} ${issues[3].originalRequest.url}`,
        result: 'FAILED',
        severity: 'LOW',
        path: 'test.spec.ts',
        line: 1
      }
    ]);
  });
});
