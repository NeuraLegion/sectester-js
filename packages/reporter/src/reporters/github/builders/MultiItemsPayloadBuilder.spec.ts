import 'reflect-metadata';
import { MultiItemsPayloadBuilder } from './MultiItemsPayloadBuilder';
import { HttpMethod, Issue, Severity } from '@sectester/scan';

describe('MultiItemsPayloadBuilder', () => {
  const createIssue = (severity: Severity, name = 'Test Issue'): Issue => ({
    name,
    severity,
    id: 'test-id',
    certainty: true,
    details: 'Test details',
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
    link: 'https://app.neuralegion.com/scan/test-id'
  });

  it('should build payload with multiple issues of different severities', () => {
    const issues = [
      createIssue(Severity.CRITICAL),
      createIssue(Severity.HIGH),
      createIssue(Severity.MEDIUM),
      createIssue(Severity.LOW)
    ];

    const builder = new MultiItemsPayloadBuilder(
      issues,
      'commit123',
      'test.spec.ts'
    );
    const payload = builder.build();

    expect(payload).toEqual({
      name: 'SecTester (4 issues)',
      head_sha: 'commit123',
      conclusion: 'failure',
      output: {
        title: '4 vulnerabilities detected in application endpoints',
        summary: '1 Critical, 1 High, 1 Medium, 1 Low severity issues found',
        text: expect.stringContaining('GET /api/test: Test Issue'),
        annotations: expect.arrayContaining([
          expect.objectContaining({
            path: 'test.spec.ts',
            annotation_level: 'failure'
          })
        ])
      }
    });
  });

  it('should build payload with no issues', () => {
    const builder = new MultiItemsPayloadBuilder(
      [],
      'commit123',
      'test.spec.ts'
    );
    const payload = builder.build();

    expect(payload.output?.summary).toBe('No issues found');
    expect(payload.output?.annotations).toHaveLength(0);
  });

  it('should build payload with multiple issues of same severity', () => {
    const issues = [
      createIssue(Severity.HIGH, 'Issue 1'),
      createIssue(Severity.HIGH, 'Issue 2'),
      createIssue(Severity.HIGH, 'Issue 3')
    ];

    const builder = new MultiItemsPayloadBuilder(
      issues,
      'commit123',
      'test.spec.ts'
    );
    const payload = builder.build();

    expect(payload.output?.summary).toBe('3 High severity issues found');
    expect(payload.output?.annotations).toHaveLength(3);
  });
});
