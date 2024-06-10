import { Repeater } from './Repeater';
import { RequestRunner, RequestRunnerOptions } from '../request-runner';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeaterBusFactory } from '../bus/RepeaterBusFactory';
import { DefaultRepeaterServerOptions } from '../bus/DefaultRepeaterServer';
import { Configuration } from '@sectester/core';
import { DependencyContainer, injectable, Lifecycle } from 'tsyringe';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
@injectable()
export class RepeaterFactory {
  private readonly runnerOptions: Readonly<RequestRunnerOptions>;

  constructor(private readonly configuration: Configuration) {
    this.runnerOptions =
      this.configuration.container.resolve(RequestRunnerOptions);
  }

  public async createRepeater({
    requestRunnerOptions,
    requestRunners = []
  }: RepeaterOptions = {}): Promise<Repeater> {
    const container = this.configuration.container.createChildContainer();

    await this.registerRepeaterServerOptions(container);
    this.registerRequestRunnerOptions(container, requestRunnerOptions);
    this.registerRequestRunners(container, requestRunners);

    const busFactory =
      container.resolve<RepeaterBusFactory>(RepeaterBusFactory);

    return new Repeater(busFactory.create());
  }

  private async registerRepeaterServerOptions(
    container: DependencyContainer
  ): Promise<void> {
    await this.configuration.loadCredentials();

    if (!this.configuration.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the bus.'
      );
    }

    container.register<DefaultRepeaterServerOptions>(
      DefaultRepeaterServerOptions,
      {
        useValue: {
          uri: `${this.configuration.api}/workstations`,
          token: this.configuration.credentials?.token as string,
          connectTimeout: 10000
        }
      }
    );
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
