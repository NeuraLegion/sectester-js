import { ScanRunner, ScanSettings, Severity, TargetOptions } from '../external';
import { Configuration } from '@secbox/core';

export class SecScan {
  private _threshold: Severity | undefined;
  private scanRunner: ScanRunner;

  constructor(
    private readonly configuration: Configuration,
    private readonly settings: Omit<ScanSettings, 'target'>
  ) {
    this.scanRunner = this.configuration.container.resolve(ScanRunner);
  }

  public async run(target: TargetOptions): Promise<void> {
    await this.scanRunner.run(
      {
        ...this.settings,
        target
      },
      this._threshold
    );

    // TODO print results? handle threshold?
  }

  public threshold(severity?: Severity): SecScan {
    this._threshold = severity;

    return this;
  }
}
