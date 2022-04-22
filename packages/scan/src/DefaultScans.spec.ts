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
    it('should execute create command', async () => {
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

    it('should throw if execution result is not defined', async () => {
      when(mockedCommandDispatcher.execute(anyOfClass(CreateScan))).thenResolve(
        undefined
      );

      const result = httpScans.create({
        name: 'test',
        tests: [TestType.DOM_XSS],
        module: Module.DAST
      });

      await expect(result).rejects.toThrow(`Failed to create scan test`);
    });
  });

  describe('listIssues', () => {
    it('should execute command to get list of issues', async () => {
      const scanId = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).thenResolve(
        []
      );

      await httpScans.listIssues(scanId);

      verify(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).once();
    });

    it('should throw if result is not defined', async () => {
      const scanId = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(ListIssues))).thenResolve(
        undefined
      );

      const result = httpScans.listIssues(scanId);

      await expect(result).rejects.toThrow(
        `Failed to get issue list for scan with id ${scanId}`
      );
    });
  });

  describe('stopScan', () => {
    it('should execute stop command', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(StopScan))).thenResolve();

      await httpScans.stopScan(id);

      verify(mockedCommandDispatcher.execute(anyOfClass(StopScan))).once();
    });
  });

  describe('getScan', () => {
    it('should return scan state', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(GetScan))).thenResolve({
        status: ScanStatus.DONE,
        issuesBySeverity: []
      } as ScanState);

      await httpScans.getScan(id);
      verify(mockedCommandDispatcher.execute(anyOfClass(GetScan))).once();
    });

    it('should throw if result is not defined', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(GetScan))).thenResolve(
        undefined
      );

      const result = httpScans.getScan(id);

      await expect(result).rejects.toThrow(
        `Failed to get status of scan with id ${id}`
      );
    });
  });

  describe('uploadHar', () => {
    it('should execute file upload command', async () => {
      const id = 'roMq1UVuhPKkndLERNKnA8';
      when(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).thenResolve({
        id
      });

      await httpScans.uploadHar({
        filename: 'test.json',
        content: harFileContent
      });

      verify(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).once();
    });

    it('should throw if result is not defined', async () => {
      const harOptions = {
        filename: 'test.json',
        content: harFileContent
      };
      when(mockedCommandDispatcher.execute(anyOfClass(UploadHar))).thenResolve(
        undefined
      );

      const result = httpScans.uploadHar(harOptions);

      await expect(result).rejects.toThrow(
        `Failet to uplad Har file ${harOptions.filename}.`
      );
    });
  });
});
