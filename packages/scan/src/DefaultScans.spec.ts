import 'reflect-metadata';
import {
  CreateScan,
  GetScan,
  ListIssues,
  StopScan,
  UploadHar
} from './commands';
import { DefaultScans } from './DefaultScans';
import { HttpMethod, Module, ScanStatus, Severity, TestType } from './models';
import {
  anyOfClass,
  instance,
  mock,
  objectContaining,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import { Har } from '@har-sdk/core';
import { CommandDispatcher, Configuration } from '@sec-tester/core';
import ci from 'ci-info';

describe('HttpScans', () => {
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
  const mockedCommandDispatcher = mock<CommandDispatcher>();
  const mockedConfiguration = mock<Configuration>();
  let scans!: DefaultScans;

  beforeEach(() => {
    scans = new DefaultScans(
      instance(mockedConfiguration),
      instance(mockedCommandDispatcher)
    );
  });

  afterEach(() =>
    reset<Configuration | CommandDispatcher | typeof ci>(
      mockedCommandDispatcher,
      mockedCi,
      mockedConfiguration
    )
  );

  describe('create', () => {
    it('should create a new scan', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).thenResolve(
        { id }
      );

      const result = await scans.createScan({
        name: 'test',
        tests: [TestType.DOM_XSS],
        module: Module.DAST
      });

      verify(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).once();
      expect(result).toMatchObject({ id });
    });

    it('should pass a creation info in a payload', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).thenResolve(
        { id }
      );
      when(mockedConfiguration.name).thenReturn('library');
      when(mockedConfiguration.version).thenReturn('v1.1.1');
      when(mockedCi.name).thenReturn('some CI');

      await scans.createScan({
        name: 'test',
        tests: [TestType.DOM_XSS],
        module: Module.DAST
      });

      verify(
        mockedCommandDispatcher.execute(
          objectContaining({
            payload: {
              info: {
                source: 'utlib',
                provider: 'some CI',
                client: {
                  name: 'library',
                  version: 'v1.1.1'
                }
              }
            }
          })
        )
      ).once();
    });

    it('should raise an error if result is not defined', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).thenResolve(
        undefined
      );

      const result = scans.createScan({
        name: 'test',
        tests: [TestType.DOM_XSS],
        module: Module.DAST
      });

      await expect(result).rejects.toThrow('Something went wrong');
    });
  });

  describe('listIssues', () => {
    it('should return a list of issues', async () => {
      const issues = [
        {
          id: 'pDzxcEXQC8df1fcz1QwPf9',
          order: 1,
          details:
            'Cross-site request forgery is a type of malicious website exploit.',
          name: 'Database connection crashed',
          severity: Severity.MEDIUM,
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
      when(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).thenResolve(
        issues
      );

      const result = await scans.listIssues(id);

      verify(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).once();
      expect(result).toEqual(issues);
    });

    it('should raise an error if result is not defined', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).thenResolve(
        undefined
      );

      const result = scans.listIssues(id);

      await expect(result).rejects.toThrow('Something went wrong');
    });
  });

  describe('stopScan', () => {
    it('should stop a scan', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(StopScan))).thenResolve();

      await scans.stopScan(id);

      verify(mockedCommandDispatcher.execute(anyOfClass(StopScan))).once();
    });
  });

  describe('getScan', () => {
    it('should execute GetScan command', async () => {
      const expected = {
        status: ScanStatus.DONE
      };
      when(mockedCommandDispatcher.execute(anyOfClass(GetScan))).thenResolve(
        expected
      );

      const result = await scans.getScan(id);

      verify(mockedCommandDispatcher.execute(anyOfClass(GetScan))).once();
      expect(result).toMatchObject(expected);
    });

    it('should raise an error if result is not defined', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(GetScan))).thenResolve(
        undefined
      );

      const result = scans.getScan(id);

      await expect(result).rejects.toThrow('Something went wrong');
    });
  });

  describe('uploadHar', () => {
    it('should upload HAR file', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).thenResolve({
        id
      });

      await scans.uploadHar({
        har,
        filename: 'test.json',
        discard: true
      });

      verify(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).once();
    });

    it('should raise an error if result is not defined', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).thenResolve(
        undefined
      );

      const result = scans.getScan(id);

      await expect(result).rejects.toThrow('Something went wrong');
    });
  });
});
