import 'reflect-metadata';
import { DefaultScans } from './DefaultScans';
import { HttpMethod, Module, ScanStatus, Severity, TestType } from './models';
import {
  anyOfClass,
  capture,
  deepEqual,
  instance,
  mock,
  reset,
  spy,
  when
} from 'ts-mockito';
import { Har } from '@har-sdk/core';
import { ApiClient, Configuration } from '@sectester/core';
import ci from 'ci-info';

describe('DefaultScans', () => {
  const id = 'roMq1UVuhPKkndLERNKnA8';
  const har: Har = {
    log: {
      version: '1.2',
      creator: { name: 'test', version: '1.0' },
      entries: [
        {
          startedDateTime: '2022-04-18T09:09:35.585Z',
          time: -1,
          request: {
            method: 'GET',
            url: 'https://example.com/',
            httpVersion: 'HTTP/0.9',
            headers: [],
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: -1
          },
          response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/0.9',
            headers: [],
            cookies: [],
            content: {
              size: -1,
              mimeType: 'text/plain'
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1
          },
          cache: {},
          timings: { send: 0, receive: 0, wait: 0 }
        }
      ]
    }
  };

  const mockedCi = spy<typeof ci>(ci);
  const mockedApiClient = mock<ApiClient>();
  const mockedConfiguration = mock<Configuration>();
  let scans!: DefaultScans;

  beforeEach(() => {
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
              name: 'test',
              tests: [TestType.CROSS_SITE_SCRIPTING],
              module: Module.DAST,
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
        name: 'test',
        tests: [TestType.CROSS_SITE_SCRIPTING],
        module: Module.DAST
      });

      expect(result).toEqual({ id });
    });
  });

  describe('listIssues', () => {
    it('should return a list of issues', async () => {
      const issues = [
        {
          id: 'pDzxcEXQC8df1fcz1QwPf9',
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
      when(mockedConfiguration.api).thenReturn('https://localhost');
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

  describe('uploadHar', () => {
    it('should upload HAR file', async () => {
      const response = new Response(JSON.stringify({ id }));
      when(
        mockedApiClient.request(
          '/api/v1/files?discard=true',
          deepEqual({
            method: 'POST',
            body: anyOfClass(FormData)
          })
        )
      ).thenResolve(response);

      const res = await scans.uploadHar({
        har,
        filename: 'test.json',
        discard: true
      });

      expect(res).toEqual({ id });
      const [, options]: [string, RequestInit | undefined] = capture<
        string,
        RequestInit | undefined
      >(mockedApiClient.request).last();

      expect(options?.body).toBeInstanceOf(FormData);
      const blob = (options?.body as FormData)?.get('file');
      expect(blob).toBeInstanceOf(Blob);
      await expect((blob as Blob)?.text()).resolves.toEqual(
        JSON.stringify(har)
      );
    });
  });
});
