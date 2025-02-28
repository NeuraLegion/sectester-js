import 'reflect-metadata';
import { SingleItemPayloadBuilder } from './SingleItemPayloadBuilder';
import { HttpMethod, Issue, Severity } from '@sectester/scan';

describe('SingleItemPayloadBuilder', () => {
  const baseIssue: Issue = {
    id: 'test-id',
    certainty: true,
    name: 'SQL Injection',
    severity: Severity.HIGH,
    details: 'Test vulnerability details',
    remedy: 'Fix the code',
    protocol: 'http',
    cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    time: new Date(),
    originalRequest: {
      method: HttpMethod.POST,
      url: 'https://example.com/api/users'
    },
    request: {
      method: HttpMethod.POST,
      url: 'https://example.com/api/users'
    },
    link: 'https://app.neuralegion.com/scan/test-id'
  };

  it('should build basic payload without optional fields', () => {
    const builder = new SingleItemPayloadBuilder(
      baseIssue,
      'commit123',
      'test.spec.ts'
    );
    const payload = builder.build();

    expect(payload).toEqual({
      name: 'SecTester - POST /api/users',
      head_sha: 'commit123',
      conclusion: 'failure',
      output: {
        title: 'SQL Injection found at POST /api/users',
        summary: expect.stringContaining('Fix the code'),
        text: 'Test vulnerability details',
        annotations: expect.arrayContaining([
          expect.objectContaining({
            path: 'test.spec.ts',
            annotation_level: 'failure',
            message:
              'SQL Injection vulnerability found at POST https://example.com/api/users'
          })
        ])
      }
    });
  });

  it('should include comments in payload details when present', () => {
    const issueWithComments = {
      ...baseIssue,
      comments: [
        {
          headline: 'Additional Info',
          text: 'Important details',
          links: ['https://owasp.org/sql-injection']
        }
      ]
    };

    const builder = new SingleItemPayloadBuilder(
      issueWithComments,
      'commit123',
      'test.spec.ts'
    );
    const payload = builder.build();

    expect(payload.output?.text).toContain('Additional Info');
    expect(payload.output?.text).toContain('Important details');
    expect(payload.output?.text).toContain('https://owasp.org/sql-injection');
  });

  it('should include resources in payload details when present', () => {
    const issueWithResources = {
      ...baseIssue,
      resources: [
        'https://example.com/resource1',
        'https://example.com/resource2'
      ]
    };

    const builder = new SingleItemPayloadBuilder(
      issueWithResources,
      'commit123',
      'test.spec.ts'
    );
    const payload = builder.build();

    expect(payload.output?.text).toContain('https://example.com/resource1');
    expect(payload.output?.text).toContain('https://example.com/resource2');
  });
});
