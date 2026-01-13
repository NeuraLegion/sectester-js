import 'reflect-metadata';
import { DefaultScans } from './DefaultScans';
import { AttackParamLocation, HttpMethod, ScanStatus, Severity } from './models';
import { anything, capture, deepEqual, instance, mock, reset, spy, when } from 'ts-mockito';
import { ApiClient, Configuration } from '@sectester/core';
import ci from 'ci-info';
import { randomUUID } from 'crypto';

describe('DefaultScans', () => {
  const id = randomUUID();
  const entryPointId = randomUUID();
  const projectId = randomUUID();

  const mockedCi = spy<typeof ci>(ci);
  const mockedApiClient = mock<ApiClient>();
  const mockedConfiguration = mock<Configuration>();
  let scans!: DefaultScans;

  beforeEach(() => {
    when(mockedConfiguration.projectId).thenReturn(projectId);
    scans = new DefaultScans(
      instance(mockedConfiguration),
      instance(mockedApiClient)
    );
  });

  afterEach(() =>
    reset<typeof ci | ApiClient | Configuration>(
      mockedApiClient,
      mockedCi,
      mockedConfiguration
    )
  );

  describe('createScan', () => {
    it('should create a new scan', async () => {
      const response = new Response(JSON.stringify({ id }));
      when(mockedConfiguration.name).thenReturn('test');
      when(mockedConfiguration.version).thenReturn('1.0');
      when(mockedCi.name).thenReturn('github');
      when(
        mockedApiClient.request(
          '/api/v1/scans',
          deepEqual({
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              projectId,
              name: 'test',
              entryPointIds: [entryPointId],
              tests: ['xss'],
              info: {
                source: 'utlib',
                provider: 'github',
                client: { name: 'test', version: '1.0' }
              }
            })
          })
        )
      ).thenResolve(response);

      const result = await scans.createScan({
        projectId,
        name: 'test',
        entryPointIds: [entryPointId],
        tests: ['xss']
      });

      expect(result).toEqual({ id });
    });

    it('should stringify config with all properties in expected by backend format', async () => {
      const response = new Response(JSON.stringify({ id }));
      const config = {
        projectId,
        name: 'test scan',
        entryPointIds: [entryPointId],
        tests: [
          'xss',
          {
            name: 'broken_access_control' as const,
            options: { auth: 'auth-id-123' }
          }
        ],
        poolSize: 10,
        requestsRateLimit: 500,
        attackParamLocations: [AttackParamLocation.QUERY, AttackParamLocation.BODY],
        repeaters: ['repeater-id-456'],
        smart: true,
        skipStaticParams: true,
        starMetadata: { customKey: 'customValue', nested: { prop: 123 } }
      };

      when(mockedConfiguration.name).thenReturn('sdk-test');
      when(mockedConfiguration.version).thenReturn('2.5.0');
      when(mockedApiClient.request('/api/v1/scans', anything())).thenResolve(
        response
      );

      const result = await scans.createScan(config);

      expect(result).toEqual({ id });
      
      const [, capturedOptions] = capture(mockedApiClient.request).last();
      expect(capturedOptions).toBeDefined();
      expect(capturedOptions).toMatchObject({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      });
      const parsedBody = JSON.parse(capturedOptions!.body as string);
      console.log('Parsed body:', JSON.stringify(parsedBody, null, 2));

      expect(parsedBody).toEqual({
        projectId,
        name: 'test scan',
        entryPointIds: [entryPointId],
        tests: [
          'xss',
          {
            name: 'broken_access_control',
            options: { auth: 'auth-id-123' }
          }
        ],
        poolSize: 10,
        requestsRateLimit: 500,
        attackParamLocations: ['query', 'body'],
        repeaters: ['repeater-id-456'],
        smart: true,
        skipStaticParams: true,
        starMetadata: { customKey: 'customValue', nested: { prop: 123 } },
        info: {
          source: 'utlib',
          provider: ci.name,
          client: { name: 'sdk-test', version: '2.5.0' }
        }
      });
    });
  });

  describe('listIssues', () => {
    it('should return a list of issues', async () => {
      const issues = [
        {
          id: randomUUID(),
          order: 1,
          severity: Severity.MEDIUM,
          details:
            'Cross-site request forgery is a type of malicious website exploit.',
          name: 'Database connection crashed',
          protocol: 'http',
          remedy:
            'The best way to protect against those kind of issues is making sure the Database resources are sufficient',
          cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L',
          time: new Date(),
          originalRequest: {
            method: HttpMethod.GET,
            url: 'https://brokencrystals.com/'
          },
          request: {
            method: HttpMethod.GET,
            url: 'https://brokencrystals.com/'
          }
        }
      ];
      const response = new Response(JSON.stringify(issues));
      when(mockedConfiguration.baseURL).thenReturn('https://localhost');
      when(mockedApiClient.request(`/api/v1/scans/${id}/issues`)).thenResolve(
        response
      );

      const result = await scans.listIssues(id);

      expect(result).toEqual(
        issues.map(x => ({
          ...x,
          link: `https://localhost/scans/${id}/issues/${x.id}`
        }))
      );
    });
  });

  describe('stopScan', () => {
    it('should stop a scan', async () => {
      const response = new Response();
      when(
        mockedApiClient.request(
          `/api/v1/scans/${id}/stop`,
          deepEqual({ method: 'POST' })
        )
      ).thenResolve(response);

      const act = scans.stopScan(id);

      await expect(act).resolves.not.toThrow();
    });
  });

  describe('deleteScan', () => {
    it('should delete a scan', async () => {
      const response = new Response();
      when(
        mockedApiClient.request(
          `/api/v1/scans/${id}`,
          deepEqual({ method: 'DELETE' })
        )
      ).thenResolve(response);

      const act = scans.deleteScan(id);

      await expect(act).resolves.not.toThrow();
    });
  });

  describe('getScan', () => {
    it('should execute GetScan command', async () => {
      const expected = {
        status: ScanStatus.DONE
      };
      const response = new Response(JSON.stringify(expected));
      when(mockedApiClient.request(`/api/v1/scans/${id}`)).thenResolve(
        response
      );

      const result = await scans.getScan(id);

      expect(result).toMatchObject(expected);
    });
  });
});
