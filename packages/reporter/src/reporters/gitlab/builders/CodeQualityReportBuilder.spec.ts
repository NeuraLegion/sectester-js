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

      expect(report).toEqual([{
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
      }]);
    });

    it.each([
      {
        severity: Severity.LOW,
        issueName: 'XSS',
        expectedSeverity: 'minor'
      },
      {
        severity: Severity.MEDIUM,
        issueName: 'CSRF',
        expectedSeverity: 'major'
      },
      {
        severity: Severity.HIGH,
        issueName: 'SQLi',
        expectedSeverity: 'critical'
      },
      {
        severity: Severity.CRITICAL,
        issueName: 'RCE',
        expectedSeverity: 'blocker'
      },
      {
        severity: 'unknown' as Severity,
        issueName: 'Unknown Issue',
        expectedSeverity: 'info'
      }
    ])('should map $severity severity to $expectedSeverity', ({ severity, issueName, expectedSeverity }) => {
      const issue = createMockIssue(issueName, severity);
      const builder = new CodeQualityReportBuilder([issue], testFilePath);
      const report = builder.build();

      expect(report).toEqual([{
        description: `${issueName} vulnerability found at GET https://brokencrystals.com/`,
        check_name: issueName,
        fingerprint: expect.any(String),
        severity: expectedSeverity,
        raw_details: expect.any(String),
        location: {
          path: testFilePath,
          lines: {
            begin: 1
          }
        }
      }]);
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
  });
});
