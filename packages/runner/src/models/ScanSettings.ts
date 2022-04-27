import { TestType } from './TestType';
import { AttackParamLocation } from './AttackParamLocation';

export interface ScanSettings {
  // The Scan name
  name: string;
  // The list of tests to be performed against the target application
  tests: TestType[];
  // Determine whether scan is smart or simple
  smart?: boolean;
  // Pool size
  poolSize?: number;
  // Allows to skip testing static parameters.
  skipStaticParams?: boolean;
  // Defines which part of the request to attack
  attackParamLocations?: AttackParamLocation[];
}
