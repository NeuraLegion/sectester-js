import {
  CountIssuesBySeverity,
  Issue,
  IssueCategory,
  Scans,
  ScanState,
  ScanStatus
} from './Scans';
import { delay } from '@secbox/bus';

export class Scan {
  private state?: ScanState;

  private readonly DELAY_TIME = 1000;

  private readonly ACTIVITY_STATUSES: readonly ScanStatus[] = [
    ScanStatus.PENDING,
    ScanStatus.RUNNING
  ];

  get active(): boolean {
    return this.ACTIVITY_STATUSES.some(status => status === this.state?.status);
  }

  constructor(public readonly id: string, private readonly scans: Scans) {
    this.state = { status: ScanStatus.PENDING, issuesBySeverity: [] };
  }

  public async issues(): Promise<Issue[]> {
    const issues = await this.scans.listIssues(this.id);

    return issues;
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    try {
      while (this.active) {
        await delay(this.DELAY_TIME);
        const state = await this.scans.getScan(this.id);

        this.state = state;

        yield state;
      }
    } catch (err) {
      await this.stop();
      throw err;
    }
  }

  public async waitFor(options: {
    expectation: 'any' | IssueCategory;
    timeout?: number;
  }): Promise<void> {
    const { expectation, timeout } = options;
    let timeoutPassed = false;
    let timeoutDescriptor;

    if (timeout) {
      timeoutDescriptor = setTimeout(() => (timeoutPassed = true), timeout);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    for await (const _ of this.status()) {
      if (this.satisfyExpectation(expectation) || timeoutPassed) {
        break;
      }
    }

    if (timeoutDescriptor) {
      clearTimeout(timeoutDescriptor);
    }
  }

  public async stop(): Promise<void> {
    if (!this.active) {
      return;
    }

    return this.scans.stopScan(this.id);
  }

  private satisfyExpectation(expectation: 'any' | IssueCategory): boolean {
    const issuesBySeverity = this.state?.issuesBySeverity ?? [];

    return issuesBySeverity.some((x: CountIssuesBySeverity) =>
      expectation !== 'any' ? x.type === expectation : !!x.number
    );
  }
}
