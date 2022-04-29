import { Reporter } from '../lib';
import { StdReporter } from './StdReporter';
import { HttpMethod, Issue, Scan, Severity } from '@secbox/scan';
import { instance, mock, reset, when } from 'ts-mockito';

const highSeverityIssue: Partial<Issue> = {
  name: 'Reflective Cross-site scripting (rXSS)',
  request: {
    method: HttpMethod.GET,
    url: 'https://qa.brokencrystals.com/?artifical3160fc2b=%22%3Cdiv+OnCliCk%3Dalert%28576485%29%3E%3C%2Fdiv%3E'
  },
  severity: Severity.HIGH
};

const mediumSeverityIssue: Partial<Issue> = {
  name: 'Directory Listing',
  request: {
    method: HttpMethod.GET,
    url: 'https://qa.brokencrystals.com/?'
  },
  severity: Severity.MEDIUM
};

const lowSeverityIssue: Partial<Issue> = {
  name: 'Misconfigured X-Content-Type-Options Header',
  request: {
    method: HttpMethod.GET,
    url: 'https://qa.brokencrystals.com/'
  },
  severity: Severity.LOW
};

describe('StdReporter', () => {
  let reporter!: Reporter;

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
  });
});
