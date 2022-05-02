import { Configuration } from '@secbox/core';
import { Reporter } from '@secbox/reporter';
import {
  ScanFactory,
  ScanSettingsOptions,
  Severity,
  TargetOptions
} from '@secbox/scan';

export class SecScan {
  private readonly scanFactory: ScanFactory;
  private readonly reporter: Reporter;
  private _threshold = Severity.LOW;

  constructor(
    private readonly configuration: Configuration,
    private readonly settings: Omit<ScanSettingsOptions, 'target'>
  ) {
    this.scanFactory = this.configuration.container.resolve(ScanFactory);
    this.reporter = this.configuration.container.resolve(Reporter);
  }

  public async run(target: TargetOptions): Promise<void> {
    const scan = await this.scanFactory.createScan({
      ...this.settings,
      target
    });

    try {
      await scan.expect(this._threshold || (() => true));

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
}
