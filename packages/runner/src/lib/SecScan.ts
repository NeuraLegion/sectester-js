import { Reporter } from '@secbox/reporter';
import {
  ScanFactory,
  ScanSettingsOptions,
  Severity,
  TargetOptions
} from '@secbox/scan';

export class SecScan {
  private _threshold = Severity.LOW;
  private _timeout: number | undefined;

  constructor(
    private readonly settings: Omit<ScanSettingsOptions, 'target'>,
    private readonly scanFactory: ScanFactory,
    private readonly reporter: Reporter
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

      const issues = await scan.issues();
      if (issues.length) {
        await this.reporter.report(scan);
        throw new Error('Target is vulnerable');
      }
    } finally {
      await scan.stop();
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
}
