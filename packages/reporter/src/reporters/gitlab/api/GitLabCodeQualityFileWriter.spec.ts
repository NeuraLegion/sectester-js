import 'reflect-metadata';
import { GitLabCIArtifactsFileWriter } from './GitLabCodeQualityFileWriter';
import type { CodeQualityReport } from '../types';
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
      codeQualityReportFilename: 'gl-code-quality-report.json'
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
});
