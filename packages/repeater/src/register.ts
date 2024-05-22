import { RepeaterFactory, RepeaterId } from './lib';
import { DefaultRepeatersManager, RepeatersManager } from './api';
import {
  DefaultRepeaterBusFactory,
  DefaultRepeaterCommandHub,
  DefaultRepeaterEventHub,
  DefaultRepeaterServer,
  RepeaterBusFactory,
  RepeaterCommandHub,
  RepeaterEventHub,
  RepeaterServer
} from './bus';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions
} from './request-runner';
import {
  container,
  DependencyContainer,
  instancePerContainerCachingFactory
} from 'tsyringe';
import {
  Configuration,
  EventBus,
  Logger,
  RetryStrategy
} from '@sectester/core';
import {
  RMQConnectionManager,
  RMQEventBus,
  RMQEventBusConfig
} from '@sectester/bus';

container.register(RequestRunner, {
  useClass: HttpRequestRunner
});

container.register(RequestRunnerOptions, {
  useValue: {
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
  }
});

container.register(RepeaterFactory, {
  useFactory(childContainer: DependencyContainer) {
    return new RepeaterFactory(childContainer.resolve(Configuration));
  }
});

container.register(RMQEventBusConfig, {
  useFactory: instancePerContainerCachingFactory(
    (childContainer: DependencyContainer) => ({
      exchange: 'EventBus',
      appQueue: 'app',
      clientQueue: `agent:${childContainer.resolve(RepeaterId)}`
    })
  )
});

container.register(EventBus, {
  useFactory: (childContainer: DependencyContainer) => {
    const connectionManager =
      childContainer.resolve<RMQConnectionManager>(RMQConnectionManager);
    const logger = childContainer.resolve(Logger);
    const retryStrategy = childContainer.resolve<RetryStrategy>(RetryStrategy);
    const eventBusConfig =
      childContainer.resolve<RMQEventBusConfig>(RMQEventBusConfig);

    return new RMQEventBus(
      childContainer,
      logger,
      retryStrategy,
      eventBusConfig,
      connectionManager
    );
  }
});

container.register(RepeatersManager, { useClass: DefaultRepeatersManager });
container.register(RepeaterServer, { useClass: DefaultRepeaterServer });
container.register(RepeaterEventHub, { useClass: DefaultRepeaterEventHub });
container.register(RepeaterCommandHub, { useClass: DefaultRepeaterCommandHub });
container.register(RepeaterBusFactory, { useClass: DefaultRepeaterBusFactory });
