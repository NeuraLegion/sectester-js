import { ScanSettingsOptions } from '@sec-tester/scan';

export type SecScanOptions = Pick<
  ScanSettingsOptions,
  | 'name'
  | 'tests'
  | 'smart'
  | 'poolSize'
  | 'skipStaticParams'
  | 'attackParamLocations'
  | 'slowEpTimeout'
  | 'targetTimeout'
>;
