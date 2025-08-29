import { CodeQualityReportBuilder } from './CodeQualityReportBuilder';
import { HttpMethod, Issue, Severity } from '@sectester/scan';
import { randomUUID } from 'node:crypto';

const createMockIssue = (
  name: string = 'SQL Injection',
  severity: Severity = Severity.HIGH
): Issue => ({
  id: randomUUID(),
  certainty: true,
  details: 'Test vulnerability details',
  name,
  severity,
  protocol: 'http',
  remedy: 'Use parameterized queries',
  cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
  time: new Date(),
  originalRequest: {
    method: HttpMethod.POST,
    url: 'https://example.com/api/login'
  },
  request: {
    method: HttpMethod.POST,
    url: 'https://example.com/api/login'
  },
  link: 'https://app.brightsec.com/scans/test/issues/test'
});

describe('CodeQualityReportBuilder', () => {
  const testFilePath = 'test/security.spec.js';

  describe('build', () => {
    it('should create empty report when no issues', () => {
      const builder = new CodeQualityReportBuilder([], testFilePath);
      const report = builder.build();

      expect(report).toEqual([]);
    });

    it('should create code quality issue from sectester issue', () => {
      const issue = createMockIssue();
      const builder = new CodeQualityReportBuilder([issue], testFilePath);
      const report = builder.build();

      expect(report).toHaveLength(1);
      expect(report[0]).toEqual({
        description:
          'SQL Injection vulnerability found at POST https://example.com/api/login',
        check_name: 'SQL Injection',
        fingerprint: expect.any(String),
        severity: 'critical',
        raw_details: expect.any(String),
        location: {
          path: testFilePath,
          lines: {
            begin: 1,
            end: 1
          }
        }
      });
    });

    it('should map severities correctly', () => {
      const lowIssue = createMockIssue('XSS', Severity.LOW);
      const mediumIssue = createMockIssue('CSRF', Severity.MEDIUM);
      const highIssue = createMockIssue('SQLi', Severity.HIGH);
      const criticalIssue = createMockIssue('RCE', Severity.CRITICAL);

      const builder = new CodeQualityReportBuilder(
        [lowIssue, mediumIssue, highIssue, criticalIssue],
        testFilePath
      );
      const report = builder.build();

      expect(report[0].severity).toBe('minor'); // LOW -> minor
      expect(report[1].severity).toBe('major'); // MEDIUM -> major
      expect(report[2].severity).toBe('critical'); // HIGH -> critical
      expect(report[3].severity).toBe('blocker'); // CRITICAL -> blocker
    });

    it('should create unique fingerprints for different issues', () => {
      const issue1 = createMockIssue('SQL Injection');
      const issue2 = createMockIssue('XSS');

      const builder = new CodeQualityReportBuilder(
        [issue1, issue2],
        testFilePath
      );
      const report = builder.build();

      expect(report[0].fingerprint).not.toBe(report[1].fingerprint);
    });

    it('should create consistent fingerprints for same issue characteristics', () => {
      const issue1 = createMockIssue('SQL Injection');
      const issue2 = createMockIssue('SQL Injection');

      // Ensure they have the same request details
      issue2.originalRequest = { ...issue1.originalRequest };

      const builder1 = new CodeQualityReportBuilder([issue1], testFilePath);
      const builder2 = new CodeQualityReportBuilder([issue2], testFilePath);

      const report1 = builder1.build();
      const report2 = builder2.build();

      expect(report1[0].fingerprint).toBe(report2[0].fingerprint);
    });

    it('should handle unknown severity gracefully', () => {
      const issue = createMockIssue('Unknown Issue', 'unknown' as Severity);
      const builder = new CodeQualityReportBuilder([issue], testFilePath);
      const report = builder.build();

      expect(report[0].severity).toBe('info');
    });
  });
});
