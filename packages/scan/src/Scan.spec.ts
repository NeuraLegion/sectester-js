import 'reflect-metadata';
import { Scan, ScanOptions } from './Scan';
import { HttpMethod, ScanState, ScanStatus, Severity } from './models';
import { Scans } from './Scans';
import { instance, mock, reset, spy, verify, when } from 'ts-mockito';

const findArg = <R>(
  args: [unknown, unknown],
  expected: 'function' | 'number'
): R => (typeof args[0] === expected ? args[0] : args[1]) as R;

const useFakeTimers = () => {
  jest.useFakeTimers();

  const mockedImplementation = jest
    .spyOn(global, 'setTimeout')
    .getMockImplementation();

  jest
    .spyOn(global, 'setTimeout')
    .mockImplementation((...args: [unknown, unknown]) => {
      // ADHOC: depending on implementation (promisify vs raw), the method signature will be different
      const callback = findArg<(..._: unknown[]) => void>(args, 'function');
      const ms = findArg<number>(args, 'number');
      const timer = mockedImplementation?.(callback, ms);

      jest.runAllTimers();

      return timer as NodeJS.Timeout;
    });
};

describe('Scan', () => {
  const id = 'roMq1UVuhPKkndLERNKnA8';
  const mockedScans = mock<Scans>();

  let scan!: Scan;
  let options!: ScanOptions;
  let spiedOptions!: ScanOptions;

  beforeEach(() => {
    useFakeTimers();
    options = { id, scans: instance(mockedScans) };
    spiedOptions = spy(options);
    scan = new Scan(options);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
    reset<Scans | ScanOptions>(mockedScans, spiedOptions);
  });

  describe('issues', () => {
    it('should return an empty list', async () => {
      when(mockedScans.listIssues(id)).thenResolve([]);
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.RUNNING });

      const result = await scan.issues();

      expect(result).toEqual([]);
      verify(mockedScans.listIssues(id)).once();
    });

    it('should return a cached result if scan is done', async () => {
      when(mockedScans.listIssues(id))
        .thenResolve([])
        .thenResolve([
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
        ]);
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.DONE });

      const result = await scan.issues();

      expect(result).toEqual([]);
    });
  });

  describe('status', () => {
    it.each([
      ScanStatus.DONE,
      ScanStatus.STOPPED,
      ScanStatus.DISRUPTED,
      ScanStatus.FAILED
    ])('should stop consuming on the %s status', async (status: ScanStatus) => {
      const expected: ScanState = {
        status
      };
      when(mockedScans.getScan(id)).thenResolve(expected);

      const result: ScanState[] = [];

      for await (const state of scan.status()) {
        result.push(state);
      }

      verify(mockedScans.getScan(id)).once();
      expect(result).toEqual([expected]);
    });

    it('should update a status multiple times util last value is consumed', async () => {
      when(mockedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.RUNNING
        })
        .thenResolve({
          status: ScanStatus.RUNNING
        })
        .thenResolve({
          status: ScanStatus.DONE
        });

      const result: ScanState[] = [];

      for await (const state of scan.status()) {
        result.push(state);
      }

      verify(mockedScans.getScan(id)).thrice();
      expect(result).toEqual(
        expect.arrayContaining([{ status: ScanStatus.DONE }])
      );
    });

    it('should return the last consumed status', async () => {
      when(mockedScans.getScan(id)).thenResolve({
        status: ScanStatus.DONE
      });

      const expected = await scan.status();
      const result = await scan.status();

      expect(result).toEqual(expected);
    });
  });

  describe('expect', () => {
    it('should satisfy an expectation', async () => {
      when(mockedScans.getScan(id)).thenResolve({
        status: ScanStatus.DONE,
        issuesBySeverity: [{ number: 1, type: Severity.HIGH }]
      });

      await scan.expect(Severity.HIGH);

      verify(mockedScans.getScan(id)).once();
    });

    it('should satisfy an expectation after a few iterations', async () => {
      when(mockedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.LOW }]
        })
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.LOW }]
        })
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.HIGH }]
        });

      await scan.expect(Severity.HIGH);

      verify(mockedScans.getScan(id)).thrice();
    });

    it('should terminate expectation due to timeout', async () => {
      scan = new Scan({ ...options, timeout: 1 });
      when(mockedScans.getScan(id)).thenResolve({
        status: ScanStatus.RUNNING,
        issuesBySeverity: [{ number: 1, type: Severity.LOW }]
      });

      const result = scan.expect(Severity.HIGH);

      expect(setTimeout).toHaveBeenCalled();
      await expect(result).rejects.toThrow('The expectation was not satisfied');
    });

    it('should use a custom expectation', async () => {
      when(mockedScans.getScan(id)).thenResolve({
        status: ScanStatus.RUNNING,
        issuesBySeverity: [{ number: 1, type: Severity.LOW }]
      });
      const fn = jest.fn().mockReturnValue(true);

      await scan.expect(fn);

      expect(fn).toHaveBeenLastCalledWith(scan);
    });

    it('should handle an error that appears in a custom expectation', async () => {
      when(mockedScans.getScan(id)).thenResolve({
        status: ScanStatus.RUNNING,
        issuesBySeverity: [{ number: 1, type: Severity.LOW }]
      });
      const fn = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('Something went wrong');
        })
        .mockImplementation(() => true);

      await scan.expect(fn);

      expect(fn).toHaveBeenLastCalledWith(scan);
    });

    it('should consider the `issuesBySeverity` as an empty array if it is not defined', async () => {
      when(mockedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.RUNNING
        })
        .thenResolve({
          status: ScanStatus.RUNNING,
          issuesBySeverity: [{ number: 1, type: Severity.LOW }]
        });

      await scan.expect(Severity.MEDIUM);

      verify(mockedScans.getScan(id)).twice();
    });
  });

  describe('stop', () => {
    it('should stop a scan', async () => {
      when(mockedScans.stopScan(id)).thenResolve();
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.RUNNING });

      await scan.stop();

      verify(mockedScans.stopScan(id)).once();
    });

    it('should do nothing if scan is already stopped', async () => {
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.DONE });

      await scan.stop();

      verify(mockedScans.stopScan(id)).never();
    });
  });
});
