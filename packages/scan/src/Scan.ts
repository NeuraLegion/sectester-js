import { IssueCategory, ScanStatus } from './enums';
import { CountIssuesBySeverity, Issue, Scans, ScanState } from './Scans';
import { delay } from './utils';

export class Scan {
  private state?: ScanState;

  private readonly DELAY_TIME = 1000;

  private ACTIVITY_STATUSES: ScanStatus[] = [
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

  public async *issues(options?: {
    limit: number;
    nextId?: string;
    nextCreatedAt?: Date;
  }): AsyncGenerator<Issue[]> {
    let nextId = options?.nextId;
    let nextCreatedAt = options?.nextCreatedAt;
    let hasNext = true;

    while (hasNext) {
      try {
        const issues = await this.scans.listIssues({
          nextId,
          nextCreatedAt,
          limit: options?.limit,
          scanId: this.id
        });

        yield issues;
        ({ id: nextId, createdAt: nextCreatedAt } =
          issues[issues.length - 1] ?? {});
        hasNext = !!nextId && !!nextCreatedAt;
      } finally {
        await this.stop();
      }
    }

    return undefined;
  }

  public async *status(): AsyncIterableIterator<ScanState> {
    while (this.active) {
      await this.delay();
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

  private async delay(): Promise<void> {
    return delay(this.DELAY_TIME);
  }
}
