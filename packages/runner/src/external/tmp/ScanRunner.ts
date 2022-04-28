import { ScanSettings } from '../ScanSettings';
import { Severity } from '../Severity';

// TODO replace this stub with real one
export class ScanRunner {
  /* istanbul ignore next */
  public run(
    settings: ScanSettings,
    threshold: Severity | undefined
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(
      `Looking for ${settings.tests} vulnerability on ${settings.target.url} with threshold ${threshold}`
    );

    return Promise.resolve();
  }
}
