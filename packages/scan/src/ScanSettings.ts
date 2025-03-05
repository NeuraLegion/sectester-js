import { AttackParamLocation, HttpMethod } from './models';
import { Target, TargetOptions } from './target';
import { checkBoundaries, contains, truncate } from '@sectester/core';

export interface ScanSettingsOptions {
  // The list of tests to be performed against the target application
  tests: string[];
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
    if (value.length > 200) {
      throw new Error('Name must be less than 200 characters.');
    }
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

  private _tests!: string[];

  get tests(): string[] {
    return this._tests;
  }

  private set tests(value: string[]) {
    const uniqueTestTypes = new Set<string>(value);

    if (uniqueTestTypes.size < 1) {
      throw new Error('Please provide at least one test.');
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

    this._attackParamLocations = this.resolveAttackParamLocations(value);
  }

  constructor({
    name,
    tests,
    target,
    repeaterId,
    smart = true,
    poolSize = 10,
    skipStaticParams = true,
    attackParamLocations = []
  }: ScanSettingsOptions) {
    this.target = target;
    const { method, parsedURL } = this.target;
    this.name = name || truncate(`${method} ${parsedURL.pathname}`, 200);
    this.poolSize = poolSize;
    this.repeaterId = repeaterId;
    this.skipStaticParams = skipStaticParams;
    this.smart = smart;
    this.tests = tests;
    this.attackParamLocations = attackParamLocations;
  }

  private resolveAttackParamLocations(
    providedLocations: AttackParamLocation[]
  ): AttackParamLocation[] {
    if (providedLocations.length > 0) {
      return [...new Set(providedLocations)];
    }

    const detectedLocations = this.detectAttackParamLocations();

    // Use default locations if none detected
    return detectedLocations.length > 0
      ? detectedLocations
      : [
          AttackParamLocation.BODY,
          AttackParamLocation.QUERY,
          AttackParamLocation.FRAGMENT
        ];
  }

  private detectAttackParamLocations(): AttackParamLocation[] {
    const locations: AttackParamLocation[] = [];

    const hasBody =
      this.target.body !== undefined &&
      this.target.method !== HttpMethod.GET &&
      this.target.method !== HttpMethod.HEAD;

    if (hasBody) {
      locations.push(AttackParamLocation.BODY);
    }

    if (this.target.query) {
      locations.push(AttackParamLocation.QUERY);
    }

    if (this.target.fragment) {
      locations.push(AttackParamLocation.FRAGMENT);
    }

    return locations;
  }
}
