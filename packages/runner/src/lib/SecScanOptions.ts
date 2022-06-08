import { ScanSettingsOptions } from '@sectester/scan';

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
