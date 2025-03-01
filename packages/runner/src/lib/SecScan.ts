import { FunctionScanTarget } from './FunctionScanTarget';
import { IssueFound } from './IssueFound';
import { Formatter, Reporter } from '@sectester/reporter';
import {
  BodyType,
  Issue,
  Scan,
  ScanFactory,
  ScanSettingsOptions,
  Severity,
  severityRanges,
  TargetOptions
} from '@sectester/scan';

export interface FunctionScanOptions<T> {
  inputSample: T;
  fn: (input: T) => Promise<unknown>;
}

export class SecScan {
  private _threshold = Severity.LOW;
  private _timeout = 600_000;

  constructor(
    private readonly settings: Omit<ScanSettingsOptions, 'target'>,
    private readonly scanFactory: ScanFactory,
    private readonly formatter: Formatter,
    private readonly reporter?: Reporter
  ) {}

  public async run<T extends BodyType>(
    options: TargetOptions | FunctionScanOptions<T>
  ): Promise<void> {
    let functionScanTarget: FunctionScanTarget | undefined;

    let targetOptions: TargetOptions;
    if (this.isFunctionScanOptions<T>(options)) {
      functionScanTarget = new FunctionScanTarget();
      const { url } = await functionScanTarget.start<T>(options.fn);

      targetOptions = {
        url,
        method: 'POST',
        body: options.inputSample,
        ...(typeof options.inputSample === 'object'
          ? { headers: { 'content-type': 'application/json' } }
          : {})
      };
    } else {
      targetOptions = options;
    }

    const scan = await this.scanFactory.createScan(
      {
        ...this.settings,
        target: targetOptions
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
      await functionScanTarget?.stop();
      await this.reporter?.report(scan);
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

  private isFunctionScanOptions<T>(x: any): x is FunctionScanOptions<T> {
    return !!x.fn;
  }
}
