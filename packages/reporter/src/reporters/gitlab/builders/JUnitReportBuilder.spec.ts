import 'reflect-metadata';
import { JUnitReportBuilder } from './JUnitReportBuilder';
import { fullyDescribedIssue } from '../../../__fixtures__/issues';
import { Issue, Severity, HttpMethod } from '@sectester/scan';

describe('JUnitReportBuilder', () => {
  const testFilePath = 'test.spec.ts';

  describe('build', () => {
    it('should create a test report with security issues as test failures', () => {
      const issues: Issue[] = [fullyDescribedIssue];
      const builder = new JUnitReportBuilder(issues, testFilePath);

      const report = builder.build();

      const expectedReport = {
        testSuites: [
          {
            name: 'Security Tests',
            tests: 1,
            failures: 1,
            time: 0,
            testCases: [
              {
                classname: 'Medium',
                name: 'Database connection crashed vulnerability found at GET https://brokencrystals.com/',
                file: testFilePath,
                time: 0,
                failure: {
                  message:
                    'Database connection crashed vulnerability found at GET https://brokencrystals.com/',
                  content: expect.stringContaining(
                    'Name: Database connection crashed'
                  )
                },
                systemOut: expect.stringContaining('Request Method: GET'),
                systemErr: expect.stringContaining(
                  '"name": "Database connection crashed"'
                )
              }
            ]
          }
        ]
      };

      expect(report).toEqual(expectedReport);
    });

    it('should map different severities to appropriate class names', () => {
      const createIssue = (severity: Severity): Issue => ({
        ...fullyDescribedIssue,
        severity,
        id: `test-${severity}`,
        name: `Test ${severity} Issue`
      });

      const issues: Issue[] = Object.values(Severity).map(severity =>
        createIssue(severity)
      );

      const builder = new JUnitReportBuilder(issues, testFilePath);
      const report = builder.build();

      expect(report.testSuites[0].testCases.map(tc => tc.classname)).toEqual(
        Object.values(Severity)
      );
    });

    it('should create descriptive test names with vulnerability and endpoint info', () => {
      const issue1: Issue = {
        ...fullyDescribedIssue,
        id: 'issue-1',
        name: 'SQL Injection',
        originalRequest: {
          method: fullyDescribedIssue.originalRequest.method,
          url: 'https://example.com/api/users'
        }
      };

      const issue2: Issue = {
        ...fullyDescribedIssue,
        id: 'issue-2',
        name: 'SQL Injection',
        originalRequest: {
          method: fullyDescribedIssue.originalRequest.method,
          url: 'https://example.com/api/products'
        }
      };

      const builder = new JUnitReportBuilder([issue1, issue2], testFilePath);
      const report = builder.build();

      const testNames = report.testSuites[0].testCases.map(tc => tc.name);

      expect(testNames).toEqual([
        'SQL Injection vulnerability found at GET https://example.com/api/users',
        'SQL Injection vulnerability found at GET https://example.com/api/products'
      ]);
    });

    it('should include CVSS information when available', () => {
      const issueWithCVSS: Issue = {
        ...fullyDescribedIssue,
        cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
      };

      const builder = new JUnitReportBuilder([issueWithCVSS], testFilePath);
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      expect(testCase.failure?.content).toContain(
        'CVSS: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H'
      );
    });

    it('should include details when available', () => {
      const issueWithDetails: Issue = {
        ...fullyDescribedIssue,
        details: 'Detailed explanation of the vulnerability'
      };

      const builder = new JUnitReportBuilder([issueWithDetails], testFilePath);
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      expect(testCase.failure?.content).toContain(
        'Detailed explanation of the vulnerability'
      );
    });

    it('should format system output correctly', () => {
      const builder = new JUnitReportBuilder(
        [fullyDescribedIssue],
        testFilePath
      );
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      const expectedSystemOut = [
        'Request Method: GET',
        'Request URL: https://brokencrystals.com/',
        `Entry Point ID: ${fullyDescribedIssue.entryPointId}`,
        `Issue ID: ${fullyDescribedIssue.id}`
      ].join('\n');

      expect(testCase.systemOut).toBe(expectedSystemOut);
    });

    it('should format failure content using GitHub-style formatting', () => {
      const builder = new JUnitReportBuilder(
        [fullyDescribedIssue],
        testFilePath
      );
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      const failureContent = testCase.failure?.content;

      expect(failureContent).not.toContain('Raw Issue Data:');
      expect(failureContent).toContain(
        'Cross-site request forgery is a type of malicious website exploit'
      );
    });

    it('should handle empty issues array', () => {
      const builder = new JUnitReportBuilder([], testFilePath);
      const report = builder.build();

      const expectedReport = {
        testSuites: [
          {
            name: 'Security Tests',
            tests: 0,
            failures: 0,
            time: 0,
            testCases: []
          }
        ]
      };

      expect(report).toEqual(expectedReport);
    });

    it('should store raw vulnerability data as JSON in system-err', () => {
      const issue: Issue = {
        ...fullyDescribedIssue,
        name: 'SQL Injection',
        request: {
          ...fullyDescribedIssue.request,
          method: HttpMethod.POST,
          url: 'https://api.example.com/users'
        }
      };
      const builder = new JUnitReportBuilder([issue], testFilePath);
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      expect(testCase.systemErr).toBeDefined();

      const rawData = JSON.parse(testCase.systemErr as string);

      // When serialized to JSON, the Date object becomes a string
      const expectedData = {
        ...issue,
        time: issue.time.toISOString()
      };
      expect(rawData).toEqual(expectedData);
    });

    it('should include GitLab attachment syntax for screenshots in system-out', () => {
      const issue: Issue = {
        ...fullyDescribedIssue,
        screenshots: [
          {
            url: 'screenshots/failure1.png',
            title: 'Login failure screenshot'
          },
          { url: 'screenshots/failure2.png', title: 'Error page screenshot' }
        ]
      };
      const builder = new JUnitReportBuilder([issue], testFilePath);
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      const systemOut = testCase.systemOut;

      expect(systemOut).toContain('[[ATTACHMENT|screenshots/failure1.png]]');
      expect(systemOut).toContain('[[ATTACHMENT|screenshots/failure2.png]]');
      expect(systemOut).toContain('Screenshots:');
    });
  });
});
