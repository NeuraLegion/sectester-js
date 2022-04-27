import { Scans } from './Scans';
import {
  Issue,
  IssueGroup,
  ScanState,
  ScanStatus,
  Severity,
  severityRanges
} from './models';
import { delay } from '@secbox/core';

export interface ScanOptions {
  id: string;
  scans: Scans;
  poolingInterval?: number;
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
  private readonly poolingInterval: number;
  private readonly timeout: number | undefined;
  private state: ScanState = { status: ScanStatus.PENDING };
  private _issues: Issue[] = [];

  constructor({ id, scans, timeout, poolingInterval = 5 * 1000 }: ScanOptions) {
    this.scans = scans;
    this.id = id;
    this.poolingInterval = poolingInterval;
    this.timeout = timeout;
  }

  get active(): boolean {
    return this.ACTIVE_STATUSES.has(this.state.status);
  }

  get done(): boolean {
    return this.DONE_STATUSES.has(this.state.status);
  }

  public async issues(): Promise<Issue[]> {
    if (!this.done) {
      this._issues = await this.scans.listIssues(this.id);
    }

    return this._issues;
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    while (this.active) {
      await delay(this.poolingInterval);

      const state = await this.scans.getScan(this.id);

      this.state = state;

      yield state;
    }

    return this.state;
  }

  public async expect(
    expectation: Severity | ((scan: Scan) => unknown)
  ): Promise<void> {
    let timeoutPassed = false;
    let timer: NodeJS.Timeout | undefined;

    if (this.timeout) {
      timer = setTimeout(() => (timeoutPassed = true), this.timeout);
    }

    const predicate = () => {
      try {
        return typeof expectation === 'function'
          ? expectation(this)
          : this.satisfyExpectation(expectation);
      } catch {
        // noop
      }
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    for await (const _status of this.status()) {
      if (!this.active || (await predicate()) || timeoutPassed) {
        break;
      }
    }

    if (timer) {
      clearTimeout(timer);
    }
  }

  public async stop(): Promise<void> {
    if (this.active) {
      return this.scans.stopScan(this.id);
    }
  }

  private satisfyExpectation(severity: Severity): boolean {
    const issueGroups = this.state.issuesBySeverity ?? [];

    return issueGroups.some((x: IssueGroup) =>
      severityRanges.get(severity)?.includes(x.type)
    );
  }
}
