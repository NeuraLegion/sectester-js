import { RepeaterFactory, RepeaterId } from './lib';
import {
  DefaultRepeaterBusFactory,
  DefaultRepeaterCommands,
  DefaultRepeaterServer,
  DefaultRepeaterServerOptions,
  RepeaterBusFactory,
  RepeaterCommands,
  RepeaterServer
} from './bus';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions
} from './request-runner';
import { DefaultRepeatersManager, RepeatersManager } from './api';
import { DefaultProxyFactory, ProxyFactory } from './utils';
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

container.register(DefaultRepeaterServerOptions, {
  useFactory: (childContainer: DependencyContainer) => {
    const configuration = childContainer.resolve<Configuration>(Configuration);

    if (!configuration.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the bridges.'
      );
    }

    return {
      uri: `${configuration.api}/workstations`,
      token: configuration.credentials.token,
      connectTimeout: 10000
    };
  }
});

container.register(ProxyFactory, { useClass: DefaultProxyFactory });
container.register(RepeaterServer, { useClass: DefaultRepeaterServer });
container.register(RepeaterCommands, { useClass: DefaultRepeaterCommands });
container.register(RepeaterBusFactory, { useClass: DefaultRepeaterBusFactory });
container.register(RepeatersManager, { useClass: DefaultRepeatersManager });
