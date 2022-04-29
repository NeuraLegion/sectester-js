import { AttackParamLocation, TestType } from './models';
import { Target, TargetOptions } from './target';
import { checkBoundaries, contains } from '@secbox/core';

export interface ScanSettingsOptions {
  // The list of tests to be performed against the target application
  tests: TestType[];
  // The target that will be attacked
  target: Target | TargetOptions;
  // The scan name
  name?: string;
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

export class ScanSettings implements ScanSettingsOptions {
  private _name!: string;

  get name(): string {
    return this._name;
  }

  private set name(value: string) {
    this._name = value;
  }

  private _repeaterId?: string;

  get repeaterId() {
    return this._repeaterId;
  }

  private set repeaterId(value) {
    this._repeaterId = value;
  }

  private _skipStaticParams!: boolean;

  get skipStaticParams(): boolean {
    return this._skipStaticParams;
  }

  private set skipStaticParams(value: boolean) {
    this._skipStaticParams = !!value;
  }

  private _smart!: boolean;

  get smart(): boolean {
    return this._smart;
  }

  set smart(value: boolean) {
    this._smart = !!value;
  }

  private _target!: Target;

  get target(): Target {
    return this._target;
  }

  private set target(value: Target | TargetOptions) {
    this._target = new Target(value);
  }

  private _targetTimeout?: number;

  get targetTimeout() {
    return this._targetTimeout;
  }

  private set targetTimeout(value) {
    if (!checkBoundaries(value, { max: 120, min: 0, exclusiveMin: true })) {
      throw new Error('Invalid target connection timeout.');
    }
    this._targetTimeout = value;
  }

  private _slowEpTimeout?: number;

  get slowEpTimeout() {
    return this._slowEpTimeout;
  }

  private set slowEpTimeout(value) {
    if (!checkBoundaries(value, { min: 100 })) {
      throw new Error('Invalid slow entry point timeout.');
    }

    this._slowEpTimeout = value;
  }

  private _poolSize!: number;

  get poolSize(): number {
    return this._poolSize;
  }

  private set poolSize(value: number) {
    if (!checkBoundaries(value, { min: 1, max: 50 })) {
      throw new Error('Invalid pool size.');
    }

    this._poolSize = value;
  }

  private _tests!: TestType[];

  get tests(): TestType[] {
    return this._tests;
  }

  private set tests(value: TestType[]) {
    if (!contains(TestType, value)) {
      throw new Error('Unknown test type supplied.');
    }

    const uniqueTestTypes = new Set<TestType>(value);

    if (uniqueTestTypes.size < 1) {
      throw new Error('Please provide a least one test.');
    }

    this._tests = [...uniqueTestTypes];
  }

  private _attackParamLocations!: AttackParamLocation[];

  get attackParamLocations() {
    return this._attackParamLocations;
  }

  private set attackParamLocations(value: AttackParamLocation[]) {
    if (!contains(AttackParamLocation, value)) {
      throw new Error('Unknown attack param location supplied.');
    }

    const uniqueAttackParamLocations = new Set<AttackParamLocation>(value);

    if (uniqueAttackParamLocations.size < 1) {
      throw new Error('Please provide a least one attack parameter location.');
    }

    this._attackParamLocations = [...uniqueAttackParamLocations];
  }

  constructor({
    name,
    tests,
    target,
    repeaterId,
    smart = true,
    poolSize = 10,
    targetTimeout = 5,
    slowEpTimeout = 1000,
    skipStaticParams = true,
    attackParamLocations = [
      AttackParamLocation.BODY,
      AttackParamLocation.QUERY,
      AttackParamLocation.FRAGMENT
    ]
  }: ScanSettingsOptions) {
    this.attackParamLocations = attackParamLocations;
    this.target = target;
    this.name = name || `${this.target.method} ${this.target.url}`;
    this.poolSize = poolSize;
    this.repeaterId = repeaterId;
    this.skipStaticParams = skipStaticParams;
    this.slowEpTimeout = slowEpTimeout;
    this.smart = smart;
    this.targetTimeout = targetTimeout;
    this.tests = tests;
  }
}
