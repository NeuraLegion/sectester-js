import 'reflect-metadata';
import { GitLabCIArtifactsFileWriter } from './GitLabCodeQualityFileWriter';
import type { CodeQualityReport, TestReport } from '../types';
import type { GitLabConfig } from './GitLabConfig';
import { writeFile } from 'node:fs/promises';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn()
}));

const mockedWriteFile = jest.mocked(writeFile);

describe('GitLabCodeQualityFileWriter', () => {
  let writer: GitLabCIArtifactsFileWriter;
  let mockConfig: GitLabConfig;

  beforeEach(() => {
    mockConfig = {
      codeQualityReportFilename: 'gl-code-quality-report.json',
      testReportFilename: 'gl-test-report.xml'
    };
    writer = new GitLabCIArtifactsFileWriter(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendCodeQualityReport', () => {
    it('should handle code quality report writing', async () => {
      const report: CodeQualityReport = [
        {
          description: 'Test vulnerability',
          check_name: 'test-check',
          raw_details: '{"test": "raw details"}',
          fingerprint: 'abc123',
          severity: 'major',
          location: {
            path: 'test.js',
            lines: {
              begin: 1
            }
          }
        }
      ];

      await writer.writeCodeQualityReport(report);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        'gl-code-quality-report.json',
        JSON.stringify(report, null, 2),
        'utf-8'
      );
    });
  });

  describe('writeTestReport', () => {
    it('should write test report as JUnit XML to specified file', async () => {
      const report: TestReport = {
        testSuites: [
          {
            name: 'Security Tests',
            tests: 1,
            failures: 1,
            time: 0,
            testCases: [
              {
                classname: 'High Security Issues',
                name: 'SQL_Injection_test',
                file: 'test.spec.ts',
                time: 0,
                failure: {
                  message: 'Security vulnerability detected: SQL Injection',
                  content: 'SQL Injection vulnerability found'
                },
                systemOut:
                  'Request Method: POST\nRequest URL: https://example.com/api/users'
              }
            ]
          }
        ]
      };

      await writer.writeTestReport(report);

      expect(mockedWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/^gl-test-report-.*\.xml$/),
        expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>'),
        'utf-8'
      );
    });
  });
});
