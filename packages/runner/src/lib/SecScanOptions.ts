import { ScanSettingsOptions } from '@secbox/scan';

export type SecScanOptions = Pick<
  ScanSettingsOptions,
  | 'name'
  | 'tests'
  | 'smart'
  | 'poolSize'
  | 'skipStaticParams'
  | 'attackParamLocations'
  | 'slowEpTimeout'
>;
