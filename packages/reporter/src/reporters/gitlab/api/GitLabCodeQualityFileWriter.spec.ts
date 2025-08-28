import 'reflect-metadata';
import { GitLabCodeQualityFileWriter } from './GitLabCodeQualityFileWriter';
import type { CodeQualityReport } from '../types';
import type { GitLabConfig } from './GitLabConfig';

// Mock the fs module
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn()
}));

describe('GitLabCodeQualityFileWriter', () => {
  let writer: GitLabCodeQualityFileWriter;
  let mockConfig: GitLabConfig;

  beforeEach(() => {
    mockConfig = {
      codeQualityReportFilename: 'gl-code-quality-report.json'
    };
    writer = new GitLabCodeQualityFileWriter(mockConfig);
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
              begin: 1,
              end: 1
            }
          }
        }
      ];

      const { writeFile } = await import('node:fs/promises');
      const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;

      await writer.sendCodeQualityReport(report);

      expect(writeFileMock).toHaveBeenCalledWith(
        'gl-code-quality-report.json',
        JSON.stringify(report, null, 2),
        'utf-8'
      );
    });

    it('should use custom filename when provided in config', async () => {
      const customConfig: GitLabConfig = {
        codeQualityReportFilename: 'custom-report.json'
      };
      const customClient = new GitLabCodeQualityFileWriter(customConfig);

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
              begin: 1,
              end: 1
            }
          }
        }
      ];

      const { writeFile } = await import('node:fs/promises');
      const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;

      await customClient.sendCodeQualityReport(report);

      expect(writeFileMock).toHaveBeenCalledWith(
        'custom-report.json',
        JSON.stringify(report, null, 2),
        'utf-8'
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
