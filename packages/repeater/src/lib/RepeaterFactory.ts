import { Repeater, RepeaterId } from './Repeater';
import { RequestRunner, RequestRunnerOptions } from '../request-runner';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeatersManager } from '../api';
import { RepeaterRequestRunnerOptions } from './RepeaterRequestRunnerOptions';
import { Configuration, EventBus } from '@sectester/core';
import { v4 as uuidv4 } from 'uuid';
import { DependencyContainer, injectable, Lifecycle } from 'tsyringe';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
@injectable()
export class RepeaterFactory {
  private readonly MAX_NAME_LENGTH = 80;
  private readonly repeatersManager: RepeatersManager;
  private readonly runnerOptions: Readonly<RequestRunnerOptions>;

  constructor(private readonly configuration: Configuration) {
    this.repeatersManager =
      this.configuration.container.resolve(RepeatersManager);
    this.runnerOptions =
      this.configuration.container.resolve(RequestRunnerOptions);
  }

  public async createRepeater({
    projectId,
    description,
    disableRandomNameGeneration,
    namePrefix = 'sectester',
    ...requestRunnerOptions
  }: RepeaterOptions = {}): Promise<Repeater> {
    const name = this.generateName(namePrefix, disableRandomNameGeneration);

    const { repeaterId } = await this.repeatersManager.createRepeater({
      description,
      projectId,
      name
    });

    return this.createRepeaterInstance(repeaterId, requestRunnerOptions);
  }

  public async createRepeaterFromExisting(
    repeaterId: string,
    options?: RepeaterRequestRunnerOptions
  ): Promise<Repeater> {
    await this.repeatersManager.getRepeater(repeaterId);

    return this.createRepeaterInstance(repeaterId, options);
  }

  private async createRepeaterInstance(
    repeaterId: string,
    {
      requestRunnerOptions,
      requestRunners = []
    }: RepeaterRequestRunnerOptions = {}
  ) {
    const container = this.configuration.container.createChildContainer();

    container.register(RepeaterId, {
      useValue: repeaterId
    });

    this.registerRequestRunnerOptions(container, requestRunnerOptions);
    this.registerRequestRunners(container, requestRunners);

    const bus = await this.createEventBus(container);

    return new Repeater({
      bus,
      repeaterId,
      configuration: this.configuration
    });
  }

  private async createEventBus(
    container: DependencyContainer
  ): Promise<EventBus> {
    await this.configuration.loadCredentials();

    if (!this.configuration.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the bus.'
      );
    }

    const bus = container.resolve<EventBus>(EventBus);

    await bus.init?.();

    return bus;
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
    container: DependencyContainer,
    requestRunners: (
      | RequestRunner
      | { new (...args: unknown[]): RequestRunner }
    )[]
  ): void {
    requestRunners.forEach(runner => {
      if (typeof runner === 'function') {
        container.register(
          RequestRunner,
          {
            useClass: runner
          },
          {
            lifecycle: Lifecycle.ContainerScoped
          }
        );
      } else {
        container.register(RequestRunner, {
          useValue: runner
        });
      }
    });
  }

  private registerRequestRunnerOptions(
    container: DependencyContainer,
    options: RequestRunnerOptions | undefined
  ): void {
    container.register(RequestRunnerOptions, {
      useValue: {
        ...this.runnerOptions,
        ...(options ?? {})
      }
    });
  }
}
