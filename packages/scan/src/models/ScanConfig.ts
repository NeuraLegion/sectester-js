import { TestType } from './TestType';
import { AttackParamLocation } from './AttackParamLocation';

export interface ScanConfig {
  name: string;
  projectId: string;
  entryPointIds: string[];
  tests?: TestType[];
  poolSize?: number;
  attackParamLocations?: AttackParamLocation[];
  repeaters?: string[];
  smart?: boolean;
  skipStaticParams?: boolean;
  slowEpTimeout?: number;
  targetTimeout?: number;
}
