import { Repeater } from './Repeater';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions,
  WsRequestRunner
} from '../request-runner';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration } from '@sectester/core';
import { v4 as uuidv4 } from 'uuid';
import { DependencyContainer, injectable } from 'tsyringe';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
@injectable()
export class RepeaterFactory {
  private readonly MAX_NAME_LENGTH = 80;
  private readonly DEFAULT_RUNNER_OPTIONS: Readonly<RequestRunnerOptions> = {
    timeout: 30000,
    maxContentLength: 100,
    reuseConnection: false,
    allowedMimes: [
      'text/html',
      'text/plain',
      'text/css',
      'text/javascript',
      'text/markdown',
      'text/xml',
      'application/javascript',
      'application/x-javascript',
      'application/json',
      'application/xml',
      'application/x-www-form-urlencoded',
      'application/msgpack',
      'application/ld+json',
      'application/graphql'
    ]
  };
  private readonly container: DependencyContainer;
  private readonly repeatersManager: RepeatersManager;
  private readonly eventBusFactory: EventBusFactory;

  constructor(private readonly configuration: Configuration) {
    this.container = this.configuration.container.createChildContainer();

    this.repeatersManager =
      this.container.resolve<RepeatersManager>(RepeatersManager);
    this.eventBusFactory =
      this.container.resolve<EventBusFactory>(EventBusFactory);
  }

  public async createRepeater({
    projectId,
    description,
    disableRandomNameGeneration,
    requestRunnerOptions,
    namePrefix = 'sectester',
    requestRunners = [HttpRequestRunner, WsRequestRunner]
  }: RepeaterOptions = {}): Promise<Repeater> {
    this.registerRequestRunners(requestRunners, requestRunnerOptions);

    const name = this.generateName(namePrefix, disableRandomNameGeneration);

    const { repeaterId } = await this.repeatersManager.createRepeater({
      description,
      projectId,
      name
    });

    const bus = await this.eventBusFactory.create(repeaterId);

    await bus.init?.();

    return new Repeater({
      repeaterId,
      bus,
      configuration: this.configuration
    });
  }

  private generateName(
    namePrefix: string,
    disableRandomNameGeneration: boolean = false
  ) {
    const normalizedPrefix = namePrefix?.trim();
    const randomPostfix = disableRandomNameGeneration ? '' : `-${uuidv4()}`;
    const name = `${normalizedPrefix}${randomPostfix}`;

    if (name.length > this.MAX_NAME_LENGTH) {
      const maxPrefixLength = this.MAX_NAME_LENGTH - randomPostfix.length;

      throw new Error(
        `Name prefix must be less than or equal to ${maxPrefixLength} characters.`
      );
    }

    return name;
  }

  private registerRequestRunners(
    requestRunners: (
      | RequestRunner
      | { new (...args: unknown[]): RequestRunner }
    )[],
    requestRunnerOptions?: RequestRunnerOptions | undefined
  ): void {
    this.registerRequestRunnerOptions(requestRunnerOptions);
    requestRunners?.forEach(runner => this.registerRequestRunner(runner));
  }

  private registerRequestRunnerOptions(
    options: RequestRunnerOptions | undefined
  ): void {
    this.container.register(RequestRunnerOptions, {
      useValue: {
        ...this.DEFAULT_RUNNER_OPTIONS,
        ...(options ?? {})
      }
    });
  }

  private registerRequestRunner(
    runner: RequestRunner | { new (...args: unknown[]): RequestRunner }
  ): void {
    if (typeof runner === 'function') {
      this.container.register(RequestRunner, {
        useClass: runner
      });
    } else {
      this.container.register(RequestRunner, {
        useValue: runner
      });
    }
  }
}
