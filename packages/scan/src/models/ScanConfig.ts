import { TestType } from './TestType';
import { AttackParamLocation } from './AttackParamLocation';

export interface ScanConfig {
  name: string;
  tests?: TestType[];
  poolSize?: number;
  attackParamLocations?: AttackParamLocation[];
  entryPointIds: string[];
  repeaters?: string[];
  smart?: boolean;
  skipStaticParams?: boolean;
  projectId?: string;
  slowEpTimeout?: number;
  targetTimeout?: number;
}
