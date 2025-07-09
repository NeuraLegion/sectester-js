import { AttackParamLocation } from './AttackParamLocation';

export interface ScanConfig {
  name: string;
  projectId: string;
  entryPointIds: string[];
  tests?: string[];
  poolSize?: number;
  requestsRateLimit?: number;
  attackParamLocations?: AttackParamLocation[];
  repeaters?: string[];
  smart?: boolean;
  skipStaticParams?: boolean;
  starMetadata?: Record<string, unknown>;
}
