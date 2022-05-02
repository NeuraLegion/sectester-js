import { Configuration } from '@secbox/core';
import {
  ScanFactory,
  ScanSettingsOptions,
  Severity,
  TargetOptions
} from '@secbox/scan';
import { StdReporter } from '@secbox/reporter';

export class SecScan {
  private readonly scanFactory: ScanFactory;
  private _threshold: Severity | undefined;

  constructor(
    private readonly configuration: Configuration,
    private readonly settings: Omit<ScanSettingsOptions, 'target'>
  ) {
    this.scanFactory = this.configuration.container.resolve(ScanFactory);
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
        await new StdReporter().report(scan);
        throw new Error('Target is vulnerable');
      }
    } finally {
      await scan.stop();
    }
  }

  public threshold(severity?: Severity): SecScan {
    this._threshold = severity;

    return this;
  }
}
