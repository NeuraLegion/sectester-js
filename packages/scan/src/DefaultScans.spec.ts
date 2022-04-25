import 'reflect-metadata';
import {
  CreateScan,
  GetScan,
  ListIssues,
  StopScan,
  UploadHar
} from './commands';
import { Module, ScanState, ScanStatus, TestType } from './Scans';
import { DefaultScans } from './DefaultScans';
import { HttpCommandDispatcher } from '@secbox/bus';
import { anyOfClass, instance, mock, reset, verify, when } from 'ts-mockito';

describe('HttpScans', () => {
  const harFileContent =
    '{"log":{"version":"1.2","creator":{"name":"test","version":"1.0"},"entries":[{"startedDateTime":"2022-04-18T09:09:35.585Z","time":-1,"request":{"url":"https://example.com","method":"GET","headers":[]},"response":{"status":200,"statusText":"Ok"},"cache":{},"timings":{"send":0,"receive":0,"wait":0}}]}}';

  const mockedCommandDispatcher = mock<HttpCommandDispatcher>();
  let httpScans!: DefaultScans;

  beforeEach(() => {
    httpScans = new DefaultScans(instance(mockedCommandDispatcher));
  });

  afterEach(() => reset(mockedCommandDispatcher));

  describe('create', () => {
    it('should execute CreateScan command', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).thenResolve(
        { id }
      );

      await httpScans.create({
        name: 'test',
        tests: [TestType.DOM_XSS],
        module: Module.DAST
      });

      verify(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).once();
    });
  });

  describe('listIssues', () => {
    it('should execute ListIssues command', async () => {
      const scanId = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).thenResolve(
        []
      );

      await httpScans.listIssues(scanId);

      verify(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).once();
    });
  });

  describe('stopScan', () => {
    it('should execute StopScan command', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(StopScan))).thenResolve();

      await httpScans.stopScan(id);

      verify(mockedCommandDispatcher.execute(anyOfClass(StopScan))).once();
    });
  });

  describe('getScan', () => {
    it('should execute GetScan command', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(GetScan))).thenResolve({
        status: ScanStatus.DONE,
        issuesBySeverity: []
      } as ScanState);

      await httpScans.getScan(id);
      verify(mockedCommandDispatcher.execute(anyOfClass(GetScan))).once();
    });
  });

  describe('uploadHar', () => {
    it('should execute UploadHar command', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).thenResolve({
        id
      });

      await httpScans.uploadHar({
        filename: 'test.json',
        har: JSON.parse(harFileContent),
        discard: true
      });

      verify(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).once();
    });
  });
});
