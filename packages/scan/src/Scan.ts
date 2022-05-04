import { Scans } from './Scans';
import {
  Issue,
  IssueGroup,
  ScanState,
  ScanStatus,
  Severity,
  severityRanges
} from './models';
import { delay } from '@sec-tester/core';

export interface ScanOptions {
  id: string;
  scans: Scans;
  pollingInterval?: number;
  timeout?: number;
}

export class Scan {
  public readonly id: string;
  private readonly ACTIVE_STATUSES: ReadonlySet<ScanStatus> = new Set([
    ScanStatus.PENDING,
    ScanStatus.RUNNING
  ]);
  private readonly DONE_STATUSES: ReadonlySet<ScanStatus> = new Set([
    ScanStatus.DISRUPTED,
    ScanStatus.DONE,
    ScanStatus.FAILED,
    ScanStatus.STOPPED
  ]);
  private readonly scans: Scans;
  private readonly pollingInterval: number;
  private readonly timeout: number | undefined;
  private state: ScanState = { status: ScanStatus.PENDING };
  private _issues: Issue[] = [];

  constructor({ id, scans, timeout, pollingInterval = 5 * 1000 }: ScanOptions) {
    this.scans = scans;
    this.id = id;
    this.pollingInterval = pollingInterval;
    this.timeout = timeout;
  }

  get active(): boolean {
    return this.ACTIVE_STATUSES.has(this.state.status);
  }

  get done(): boolean {
    return this.DONE_STATUSES.has(this.state.status);
  }

  public async issues(): Promise<Issue[]> {
    await this.refreshState();

    if (!this.done) {
      this._issues = await this.scans.listIssues(this.id);
    }

    return this._issues;
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    while (this.active) {
      await delay(this.pollingInterval);

      yield this.refreshState();
    }

    return this.state;
  }

  public async expect(
    expectation: Severity | ((scan: Scan) => unknown)
  ): Promise<void> {
    let timeoutPassed = false;

    const timer: NodeJS.Timeout | undefined = this.timeout
      ? setTimeout(() => (timeoutPassed = true), this.timeout)
      : undefined;

    const predicate = this.createPredicate(expectation);

    let status: ScanStatus | undefined;
    for await ({ status } of this.status()) {
      const preventFurtherPolling =
        this.done || (await predicate()) || timeoutPassed;

      if (preventFurtherPolling) {
        break;
      }
    }

    if (timer) {
      clearTimeout(timer);
    }

    if (this.done && status !== ScanStatus.DONE) {
      throw new Error(`Scan failed with status ${status}.`);
    }

    if (timeoutPassed) {
      throw new Error(
        `The expectation was not satisfied within the ${this.timeout} ms timeout specified.`
      );
    }
  }

  public async stop(): Promise<void> {
    await this.refreshState();

    if (this.active) {
      return this.scans.stopScan(this.id);
    }
  }

  private async refreshState(): Promise<ScanState> {
    if (!this.done) {
      this.state = await this.scans.getScan(this.id);
    }

    return this.state;
  }

  private createPredicate(
    expectation: Severity | ((scan: Scan) => unknown)
  ): () => unknown {
    return () => {
      try {
        return typeof expectation === 'function'
          ? expectation(this)
          : this.satisfyExpectation(expectation);
      } catch {
        // noop
      }
    };
  }

  private satisfyExpectation(severity: Severity): boolean {
    const issueGroups = this.state.issuesBySeverity ?? [];

    return issueGroups.some(
      (x: IssueGroup) =>
        severityRanges.get(severity)?.includes(x.type) && x.number > 0
    );
  }
}
