import 'reflect-metadata';
import { JUnitReportBuilder } from './JUnitReportBuilder';
import { fullyDescribedIssue } from '../../../__fixtures__/issues';
import { type Issue } from '@sectester/scan';

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
            name: 'Bright Tests',
            tests: 1,
            failures: 1,
            time: 0,
            testCases: [
              {
                classname: 'GET https://brokencrystals.com/',
                name: 'Database connection crashed',
                file: testFilePath,
                time: 0,
                failure:
                  'Database connection crashed vulnerability found at GET https://brokencrystals.com/',
                systemOut: JSON.stringify(fullyDescribedIssue)
              }
            ]
          }
        ]
      };

      expect(report).toEqual(expectedReport);
    });

    it('should store raw vulnerability data as JSON in system-out', () => {
      const builder = new JUnitReportBuilder(
        [fullyDescribedIssue],
        testFilePath
      );
      const report = builder.build();

      const testCase = report.testSuites[0].testCases[0];
      const expectedSystemOut = JSON.stringify(fullyDescribedIssue);

      expect(testCase.systemOut).toBe(expectedSystemOut);
    });

    it('should handle empty issues array', () => {
      const builder = new JUnitReportBuilder([], testFilePath);
      const report = builder.build();

      const expectedReport = {
        testSuites: [
          {
            name: 'Bright Tests',
            tests: 0,
            failures: 0,
            time: 0,
            testCases: []
          }
        ]
      };

      expect(report).toEqual(expectedReport);
    });
  });
});
