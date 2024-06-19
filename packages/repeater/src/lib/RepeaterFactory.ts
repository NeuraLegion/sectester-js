import { Repeater } from './Repeater';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeaterBridgesOptions } from './RepeaterBridgesOptions';
import { RequestRunner, RequestRunnerOptions } from '../request-runner';
import { Configuration } from '@sectester/core';
import { v4 as uuidv4 } from 'uuid';
import { DependencyContainer, injectable, Lifecycle } from 'tsyringe';
import { hostname } from 'os';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
@injectable()
export class RepeaterFactory {
  private readonly MAX_NAME_LENGTH = 80;
  private readonly runnerOptions: Readonly<RequestRunnerOptions>;

  constructor(private readonly configuration: Configuration) {
    this.runnerOptions =
      this.configuration.container.resolve(RequestRunnerOptions);
  }

  public async createRepeater({
    disableRandomNameGeneration,
    requestRunnerOptions,
    requestRunners,
    namePrefix = hostname()
  }: RepeaterOptions = {}): Promise<Repeater> {
    await this.configuration.loadCredentials();

    const container = this.configuration.container.createChildContainer();

    const repeaterBridgesOptions: RepeaterBridgesOptions = {
      domain: this.generateName(namePrefix, disableRandomNameGeneration)
    };

    container.register(RepeaterBridgesOptions, {
      useValue: repeaterBridgesOptions
    });

    this.registerRequestRunnerOptions(container, requestRunnerOptions);
    this.registerRequestRunners(container, requestRunners ?? []);

    return container.resolve(Repeater);
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
}
