/* istanbul ignore file */

import { SecRunner, SecScan } from './lib';
import { SecScanOptions } from './lib/SecScanOptions';
import { Severity, TargetOptions, TestType } from '@secbox/scan';

const runner: SecRunner = new SecRunner({
  cluster: 'development.playground.neuralegion.com'
});

const runScan = async (
  target: TargetOptions,
  scanOptions: SecScanOptions,
  threshold: Severity
) => {
  await runner.init();

  const scan: SecScan = runner.createScan(scanOptions).threshold(threshold);

  return scan.run(target);
};

runScan(
  { url: 'https://brokencrystals.com' },
  {
    slowEpTimeout: 20000,
    tests: [TestType.INSECURE_TLS_CONFIGURATION, TestType.HEADER_SECURITY]
  },
  Severity.LOW
)
  // eslint-disable-next-line no-console
  .then(() => console.log('No vulnerabilities found!'))
  // eslint-disable-next-line no-console
  .catch(e => console.error(e))
  .finally(async () => runner.clear());
