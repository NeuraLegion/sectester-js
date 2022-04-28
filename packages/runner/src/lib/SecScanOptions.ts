import { ScanSettings } from '../external';

export type SecScanOptions = Pick<
  ScanSettings,
  | 'name'
  | 'tests'
  | 'smart'
  | 'poolSize'
  | 'skipStaticParams'
  | 'attackParamLocations'
>;
