import { IssueFound } from './IssueFound';
import { PayloadScanTarget } from './PayloadScanTarget';
import { Formatter } from '@sectester/reporter';
import {
  Issue,
  Scan,
  ScanFactory,
  ScanSettingsOptions,
  Severity,
  severityRanges,
  TargetOptions
} from '@sectester/scan';

export class SecScan {
  private _threshold = Severity.LOW;
  private _timeout = 600_000;

  constructor(
    private readonly settings: Omit<ScanSettingsOptions, 'target'>,
    private readonly scanFactory: ScanFactory,
    private readonly formatter: Formatter
  ) {}

  public async run(target: TargetOptions): Promise<void> {
    const scan = await this.scanFactory.createScan(
      {
        ...this.settings,
        target
      },
      {
        timeout: this._timeout
      }
    );

    try {
      await scan.expect(this._threshold);

      await this.assert(scan);
    } finally {
      await scan.stop();
    }
  }

  public async runPayloadScan<T>(
    sampleData: unknown,
    fn: (input: T) => Promise<string>
  ): Promise<void> {
    const target = new PayloadScanTarget();
    const { url } = await target.start(fn);

    const scan = await this.scanFactory.createScan(
      {
        ...this.settings,
        target: {
          url,
          method: 'POST',
          body: sampleData
        }
      },
      {
        timeout: this._timeout
      }
    );

    try {
      await scan.expect(this._threshold);

      await this.assert(scan);
    } finally {
      await scan.stop();
      await target.stop();
    }
  }

  public threshold(severity: Severity): SecScan {
    this._threshold = severity;

    return this;
  }

  public timeout(value: number): SecScan {
    this._timeout = value;

    return this;
  }

  private async assert(scan: Scan): Promise<void | never> {
    const issue = await this.findExpectedIssue(scan);

    if (issue) {
      throw new IssueFound(issue, this.formatter);
    }
  }

  private async findExpectedIssue(scan: Scan): Promise<Issue | undefined> {
    const issues = await scan.issues();

    if (this._threshold) {
      return issues.find(x =>
        severityRanges.get(this._threshold)?.includes(x.severity)
      );
    }
  }
}
