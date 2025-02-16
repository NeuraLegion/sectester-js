import 'reflect-metadata';
import { Scan, ScanOptions } from './Scan';
import { HttpMethod, Issue, ScanState, ScanStatus, Severity } from './models';
import { Scans } from './Scans';
import { ScanAborted, ScanTimedOut } from './exceptions';
import { instance, mock, reset, spy, verify, when } from 'ts-mockito';
import { Logger } from '@sectester/core';
import timers from 'node:timers/promises';
import { TimerOptions } from 'node:timers';

const useFakeTimers = () => {
  jest.useFakeTimers();

  const mockedPromisesImplementation = jest
    .spyOn(timers, 'setTimeout')
    .getMockImplementation();

  jest
    .spyOn(timers, 'setTimeout')
    .mockImplementation(
      async (...args: [number | undefined, unknown, TimerOptions?]) => {
        const promise = mockedPromisesImplementation?.(...args);
        await jest.runAllTimersAsync();
        await promise;

        return args[1];
      }
    );
};

describe('Scan', () => {
  const id = 'roMq1UVuhPKkndLERNKnA8';
  const mockedScans = mock<Scans>();
  const mockedLogger = mock<Logger>();

  let scan!: Scan;
  let options!: ScanOptions;
  let spiedOptions!: ScanOptions;

  beforeEach(() => {
    useFakeTimers();
    options = {
      id,
      scans: instance(mockedScans),
      logger: instance(mockedLogger)
    };
    spiedOptions = spy(options);
    scan = new Scan(options);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
    reset<Scans | Logger | ScanOptions>(
      mockedScans,
      mockedLogger,
      spiedOptions
    );
  });

  describe('issues', () => {
    it('should return an empty list', async () => {
      when(mockedScans.listIssues(id)).thenResolve([]);
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.RUNNING });

      const result = await scan.issues();

      expect(result).toEqual([]);
      verify(mockedScans.listIssues(id)).once();
    });

    it('should return a list of issues', async () => {
      const issue: Issue = {
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
        },
        link: 'https://app.neuralegion.com/scans/pDzxcEXQC8df1fcz1QwPf9/issues/pDzxcEXQC8df1fcz1QwPf9'
      };
      when(mockedScans.listIssues(id)).thenResolve([issue]);
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.DONE });

      const result = await scan.issues();

      expect(result).toEqual([issue]);
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

    it('should not query the status as soon as the final state reached', async () => {
      when(mockedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.RUNNING
        })
        .thenResolve({
          status: ScanStatus.DONE
        })
        .thenResolve({
          status: ScanStatus.RUNNING
        });

      const result: ScanState[] = [];

      for await (const state of scan.status()) {
        result.push(state);
      }

      verify(mockedScans.getScan(id)).twice();
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

      expect(timers.setTimeout).toHaveBeenCalled();
      await expect(result).rejects.toThrow(ScanTimedOut);
    });

    it('should raise an error if the scan finishes with status different from `done`', async () => {
      scan = new Scan({ ...options });
      when(mockedScans.getScan(id)).thenResolve({
        status: ScanStatus.FAILED
      });

      const result = scan.expect(Severity.HIGH);

      await expect(result).rejects.toThrow(ScanAborted);
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

    it('should log a warn when scan enters into queued', async () => {
      when(mockedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.QUEUED
        })
        .thenResolve({
          status: ScanStatus.RUNNING
        })
        .thenResolve({
          status: ScanStatus.DONE
        });

      await scan.expect(Severity.LOW);

      verify(
        mockedLogger.warn(
          'The maximum amount of concurrent scans has been reached for the organization, ' +
            'the execution will resume once a free engine will be available. ' +
            'If you want to increase the execution concurrency, ' +
            'please upgrade your subscription or contact your system administrator'
        )
      ).once();
    });

    it('should log a info when scan enters into running from queued', async () => {
      when(mockedScans.getScan(id))
        .thenResolve({
          status: ScanStatus.QUEUED
        })
        .thenResolve({
          status: ScanStatus.RUNNING
        })
        .thenResolve({
          status: ScanStatus.DONE
        });

      await scan.expect(Severity.LOW);

      verify(
        mockedLogger.log('Connected to engine, resuming execution')
      ).once();
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

      await scan.expect(Severity.LOW);

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

    it('should handle and ignore an error', async () => {
      when(mockedScans.stopScan(id)).thenReject(
        new Error(
          'Is not possible to change the scan status from done to stopped.'
        )
      );
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.DONE });

      await expect(scan.stop()).resolves.not.toThrow();
    });
  });

  describe('dispose', () => {
    it('should dispose a scan', async () => {
      when(mockedScans.deleteScan(id)).thenResolve();
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.STOPPED });

      await scan.dispose();

      verify(mockedScans.deleteScan(id)).once();
    });

    it('should do nothing if scan is active', async () => {
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.RUNNING });

      await scan.dispose();

      verify(mockedScans.deleteScan(id)).never();
    });

    it('should handle and ignore an error', async () => {
      when(mockedScans.deleteScan(id)).thenReject(
        new Error(
          'The scan did not finish yet, please try deleting it after it has stopped.'
        )
      );
      when(mockedScans.getScan(id)).thenResolve({ status: ScanStatus.RUNNING });

      await expect(scan.dispose()).resolves.not.toThrow();
    });
  });
});
