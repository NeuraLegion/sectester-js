import { AttackParamLocation, TestType } from './models';
import { Target } from './Target';

export interface ScanSettings {
  // The Scan name
  name: string;
  // The list of tests to be performed against the target application
  tests: TestType[];
  // The target that will be attacked
  target: Target;
  // ID of the repeater
  repeaterId?: string;
  // Determine whether scan is smart or simple
  smart?: boolean;
  // Pool size
  poolSize?: number;
  // Threshold for slow entry points in milliseconds
  slowEpTimeout?: number;
  // Measure timeout responses from the target application globally,
  // and stop the scan if the target is unresponsive for longer than the specified time
  targetTimeout?: number;
  // Allows to skip testing static parameters.
  skipStaticParams?: boolean;
  // Defines which part of the request to attack
  attackParamLocations?: AttackParamLocation[];
}
