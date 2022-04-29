import { Module } from './Module';
import { TestType } from './TestType';
import { Discovery } from './Discovery';
import { AttackParamLocation } from './AttackParamLocation';

export interface ScanConfig {
  name: string;
  module?: Module;
  tests?: TestType[];
  discoveryTypes?: Discovery[];
  poolSize?: number;
  attackParamLocations?: AttackParamLocation[];
  fileId?: string;
  hostsFilter?: string[];
  repeaters?: string[];
  smart?: boolean;
  skipStaticParams?: boolean;
  projectId?: string;
  slowEpTimeout?: number;
  targetTimeout?: number;
}
