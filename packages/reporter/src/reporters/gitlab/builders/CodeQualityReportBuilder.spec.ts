import { CodeQualityReportBuilder } from './CodeQualityReportBuilder';
import { fullyDescribedIssue } from '../../../__fixtures__/issues';
import { Issue, Severity } from '@sectester/scan';

const createMockIssue = (
  name: string = 'SQL Injection',
  severity: Severity = Severity.HIGH
): Issue => ({ ...fullyDescribedIssue, name, severity });

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
          'SQL Injection vulnerability found at GET https://brokencrystals.com/',
        check_name: 'SQL Injection',
        fingerprint: expect.any(String),
        severity: 'critical',
        raw_details: expect.any(String),
        location: {
          path: testFilePath,
          lines: {
            begin: 1
          }
        }
      });
    });

    it('should map LOW severity to minor', () => {
      const lowIssue = createMockIssue('XSS', Severity.LOW);
      const builder = new CodeQualityReportBuilder([lowIssue], testFilePath);
      const report = builder.build();

      expect(report[0].severity).toBe('minor');
    });

    it('should map MEDIUM severity to major', () => {
      const mediumIssue = createMockIssue('CSRF', Severity.MEDIUM);
      const builder = new CodeQualityReportBuilder([mediumIssue], testFilePath);
      const report = builder.build();

      expect(report[0].severity).toBe('major');
    });

    it('should map HIGH severity to critical', () => {
      const highIssue = createMockIssue('SQLi', Severity.HIGH);
      const builder = new CodeQualityReportBuilder([highIssue], testFilePath);
      const report = builder.build();

      expect(report[0].severity).toBe('critical');
    });

    it('should map CRITICAL severity to blocker', () => {
      const criticalIssue = createMockIssue('RCE', Severity.CRITICAL);
      const builder = new CodeQualityReportBuilder(
        [criticalIssue],
        testFilePath
      );
      const report = builder.build();

      expect(report[0].severity).toBe('blocker');
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

      expect(report1[0]).toEqual(report2[0]);
    });

    it('should handle unknown severity gracefully', () => {
      const issue = createMockIssue('Unknown Issue', 'unknown' as Severity);
      const builder = new CodeQualityReportBuilder([issue], testFilePath);
      const report = builder.build();

      expect(report[0].severity).toBe('info');
    });
  });
});
