import { Scans } from './Scans';
import {
  Issue,
  IssueGroup,
  ScanState,
  ScanStatus,
  Severity,
  severityRanges
} from './models';
import { ScanAborted, ScanTimedOut } from './exceptions';
import { Logger } from '@sectester/core';
import { setTimeout } from 'node:timers/promises';

export interface ScanOptions {
  id: string;
  scans: Scans;
  logger?: Logger;
  pollingInterval?: number;
  timeout?: number;
}

export class Scan {
  public readonly id: string;
  private readonly ACTIVE_STATUSES: ReadonlySet<ScanStatus> = new Set([
    ScanStatus.PENDING,
    ScanStatus.RUNNING,
    ScanStatus.QUEUED
  ]);
  private readonly DONE_STATUSES: ReadonlySet<ScanStatus> = new Set([
    ScanStatus.DISRUPTED,
    ScanStatus.DONE,
    ScanStatus.FAILED,
    ScanStatus.STOPPED
  ]);
  private readonly scans: Scans;
  private readonly pollingInterval: number;
  private readonly logger: Logger | undefined;
  private readonly timeout: number | undefined;
  private state: ScanState = { status: ScanStatus.PENDING };

  constructor({
    id,
    scans,
    logger,
    timeout,
    pollingInterval = 5 * 1000
  }: ScanOptions) {
    this.scans = scans;
    this.logger = logger;
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

    return this.scans.listIssues(this.id);
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    while (this.active) {
      await setTimeout(this.pollingInterval);

      yield this.refreshState();
    }

    return this.state;
  }

  public async expect(
    expectation: Severity | ((scan: Scan) => unknown)
  ): Promise<void> {
    const signal = this.timeout ? AbortSignal.timeout(this.timeout) : undefined;

    const predicate = this.createPredicate(expectation);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    for await (const _ of this.status()) {
      const preventFurtherPolling =
        (await predicate()) || this.done || signal?.aborted;

      if (preventFurtherPolling) {
        break;
      }
    }

    this.assert(signal?.aborted);
  }

  public async dispose(): Promise<void> {
    try {
      await this.refreshState();

      if (!this.active) {
        await this.scans.deleteScan(this.id);
      }
    } catch {
      // noop
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.refreshState();

      if (this.active) {
        await this.scans.stopScan(this.id);
      }
    } catch {
      // noop
    }
  }

  private assert(timeoutPassed?: boolean) {
    const { status } = this.state;

    if (this.done && status !== ScanStatus.DONE) {
      throw new ScanAborted(status);
    }

    if (timeoutPassed) {
      throw new ScanTimedOut(this.timeout ?? 0);
    }
  }

  private async refreshState(): Promise<ScanState> {
    if (!this.done) {
      const lastState = this.state;

      this.state = await this.scans.getScan(this.id);

      this.changingStatus(lastState.status, this.state.status);
    }

    return this.state;
  }

  private changingStatus(from: ScanStatus, to: ScanStatus): void {
    if (from !== ScanStatus.QUEUED && to === ScanStatus.QUEUED) {
      this.logger?.warn(
        'The maximum amount of concurrent scans has been reached for the organization, ' +
          'the execution will resume once a free engine will be available. ' +
          'If you want to increase the execution concurrency, ' +
          'please upgrade your subscription or contact your system administrator'
      );
    }

    if (from === ScanStatus.QUEUED && to !== ScanStatus.QUEUED) {
      this.logger?.log('Connected to engine, resuming execution');
    }
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
