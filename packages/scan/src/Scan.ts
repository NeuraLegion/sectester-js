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
    if (!this.state) {
      return false;
    }

    return this.ACTIVITY_STATUSES.includes(this.state.status);
  }

  constructor(public readonly id: string, private readonly scans: Scans) {
    this.state = { status: ScanStatus.PENDING, issuesBySeverity: [] };
  }

  public async issues(): Promise<Issue[]> {
    const issues = await this.scans.listIssues(this.id);

    return issues;
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    while (this.active) {
      await delay(this.DELAY_TIME);
      try {
        const state = await this.scans.getScan(this.id);

        this.state = state;

        yield state;
      } finally {
        await this.stop();
      }
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
      if (this.satisfyExpectation(expectation)) {
        break;
      }

      if (timeoutPassed) {
        throw new Error(`Exceeded allowed timeout (${timeout})`);
      }
    }

    if (timeoutDescriptor) {
      clearTimeout(timeoutDescriptor);
    }
  }

  public async stop(): Promise<void> {
    return this.scans.stopScan(this.id);
  }

  private satisfyExpectation(expectation: 'any' | IssueCategory): boolean {
    const issuesBySeverity = this.state?.issuesBySeverity ?? [];

    return issuesBySeverity.some((x: CountIssuesBySeverity) =>
      expectation !== 'any' ? x.type === expectation : !!x.number
    );
  }
}
