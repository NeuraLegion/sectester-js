import 'reflect-metadata';
import { StdReporter } from './StdReporter';
import { HttpMethod, Issue, Scan, Severity } from '@sec-tester/scan';
import { instance, mock, reset, when } from 'ts-mockito';

const highSeverityIssue: Partial<Issue> = {
  name: 'a',
  request: {
    method: HttpMethod.GET,
    url: 'x'
  },
  severity: Severity.HIGH
};

const mediumSeverityIssue: Partial<Issue> = {
  name: 'b',
  request: {
    method: HttpMethod.GET,
    url: 'y'
  },
  severity: Severity.MEDIUM
};

const lowSeverityIssue: Partial<Issue> = {
  name: 'c',
  request: {
    method: HttpMethod.GET,
    url: 'z'
  },
  severity: Severity.LOW
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const tableRowRegex = (...columnTexts: string[]) =>
  columnTexts.map(x => escapeRegex(x)).join('[ │]+');

describe('StdReporter', () => {
  let reporter!: StdReporter;

  const mockedScan = mock<Scan>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {
      /* noop */
    });
    jest.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    });

    reporter = new StdReporter();
  });

  afterEach(() => {
    jest.resetAllMocks();
    reset<Scan>(mockedScan);
  });

  describe('report', () => {
    it('should log high severity issue to stderr', async () => {
      when(mockedScan.issues()).thenResolve([highSeverityIssue] as Issue[]);

      await reporter.report(instance(mockedScan));

      /* eslint-disable no-console */
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching('Found 1 High severity issue')
      );
      expect(console.warn).not.toHaveBeenCalled();
      /* eslint-enable no-console */
    });

    it('should log medium severity issue to stderr', async () => {
      when(mockedScan.issues()).thenResolve([
        mediumSeverityIssue,
        mediumSeverityIssue
      ] as Issue[]);

      await reporter.report(instance(mockedScan));

      /* eslint-disable no-console */
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching('Found 2 Medium severity issues')
      );
      /* eslint-enable no-console */
    });

    it('should log low severity issue to stdout', async () => {
      when(mockedScan.issues()).thenResolve([lowSeverityIssue] as Issue[]);

      await reporter.report(instance(mockedScan));

      /* eslint-disable no-console */
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching('Found 1 Low severity issue')
      );
      /* eslint-enable no-console */
    });

    it('should log mixed severity issues to stdout', async () => {
      when(mockedScan.issues()).thenResolve([
        lowSeverityIssue,
        mediumSeverityIssue,
        highSeverityIssue
      ] as Issue[]);

      await reporter.report(instance(mockedScan));

      /* eslint-disable no-console */
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching('Found 1 High severity issue')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching('Found 1 Medium severity issue')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching('Found 1 Low severity issue')
      );
      /* eslint-enable no-console */
    });

    it('should not log anything if there are no issues', async () => {
      when(mockedScan.issues()).thenResolve([]);

      await reporter.report(instance(mockedScan));

      /* eslint-disable no-console */
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
      /* eslint-enable no-console */
    });

    it('should print summary table header', async () => {
      when(mockedScan.issues()).thenResolve([mediumSeverityIssue] as Issue[]);

      await reporter.report(instance(mockedScan));

      /* eslint-disable no-console */
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(
          tableRowRegex('Severity', 'Name', 'Quantity', 'Targets')
        )
      );
      /* eslint-enable no-console */
    });

    it('should print issues details in table form', async () => {
      const issues = [
        lowSeverityIssue,
        mediumSeverityIssue,
        highSeverityIssue
      ] as Issue[];
      when(mockedScan.issues()).thenResolve(issues);

      await reporter.report(instance(mockedScan));

      issues.forEach((issue: Issue) => {
        /* eslint-disable no-console */
        expect(console.log).toHaveBeenLastCalledWith(
          expect.stringMatching(
            tableRowRegex(issue.name, '1', `1.\u00A0${issue.request.url}`)
          )
        );
        /* eslint-enable no-console */
      });
    });
  });
});
