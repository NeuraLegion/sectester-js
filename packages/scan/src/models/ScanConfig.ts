import { AttackParamLocation } from './AttackParamLocation';
import { Test } from './Tests';

export interface ScanConfig {
  name: string;
  projectId: string;
  entryPointIds: string[];
  tests?: Test[];
  poolSize?: number;
  requestsRateLimit?: number;
  attackParamLocations?: AttackParamLocation[];
  repeaters?: string[];
  smart?: boolean;
  skipStaticParams?: boolean;
  starMetadata?: Record<string, unknown>;
}
