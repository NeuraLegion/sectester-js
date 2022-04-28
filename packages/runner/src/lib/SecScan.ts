import { ScanSettings, Severity, TargetOptions } from '../external';

// TODO actual call
const tmpRunScan = (
  settings: ScanSettings,
  threshold: Severity | undefined
): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(
    `Looking for ${settings.tests} vulnerability on ${settings.target.url} with threshold ${threshold}`
  );

  return Promise.resolve();
};

export class SecScan {
  private _threshold: Severity | undefined;

  constructor(private readonly settings: Omit<ScanSettings, 'target'>) {}

  public run(target: TargetOptions): Promise<void> {
    return tmpRunScan(
      {
        ...this.settings,
        target
      },
      this._threshold
    );
  }

  public threshold(severity?: Severity): SecScan {
    this._threshold = severity;

    return this;
  }
}
