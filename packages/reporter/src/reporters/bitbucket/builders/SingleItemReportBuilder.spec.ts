import 'reflect-metadata';
import { SingleItemReportBuilder } from './SingleItemReportBuilder';
import { HttpMethod, Issue, Severity } from '@sectester/scan';

describe('SingleItemReportBuilder', () => {
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

  const mapSeverityToAnnotationSeverity = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL:
        return 'CRITICAL';
      case Severity.HIGH:
        return 'HIGH';
      case Severity.MEDIUM:
        return 'MEDIUM';
      case Severity.LOW:
        return 'LOW';
    }
  };

  it.each([Severity.CRITICAL, Severity.HIGH, Severity.LOW, Severity.MEDIUM])(
    'should build report for %s severity',
    severity => {
      const issue = createIssue(severity);

      const builder = new SingleItemReportBuilder(issue, 'test.spec.ts');
      const { report, annotations } = builder.build();

      expect(report).toEqual({
        title: 'SecTester - GET /api/test',
        details: issue.details,
        reporter: 'SecTester',
        report_type: 'SECURITY',
        result: 'FAILED',
        link: issue.link,
        data: [
          { title: 'Vulnerability', type: 'TEXT', value: issue.name },
          { title: 'Severity', type: 'TEXT', value: severity }
        ]
      });

      expect(annotations).toEqual([
        {
          severity: mapSeverityToAnnotationSeverity(severity),
          details: issue.details,
          link: issue.link,
          title: issue.name,
          external_id: issue.id,
          annotation_type: 'VULNERABILITY',
          summary: `${issue.name} vulnerability found at GET https://example.com/api/test`,
          result: 'FAILED',
          path: 'test.spec.ts',
          line: 1
        }
      ]);
    }
  );
});
