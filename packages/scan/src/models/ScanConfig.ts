import { AttackParamLocation } from './AttackParamLocation';

export interface ScanConfig {
  name: string;
  projectId: string;
  entryPointIds: string[];
  tests?: string[];
  poolSize?: number;
  attackParamLocations?: AttackParamLocation[];
  repeaters?: string[];
  smart?: boolean;
  skipStaticParams?: boolean;
  slowEpTimeout?: number;
  targetTimeout?: number;
}
