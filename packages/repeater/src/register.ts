import {
  RepeaterFactory,
  DefaultRepeaterCommands,
  DefaultRepeaterServer,
  DefaultRepeater,
  DefaultRepeaterServerOptions,
  RepeaterCommands,
  RepeaterServer,
  Repeater
} from './lib';
import {
  HttpRequestRunner,
  RequestRunner,
  RequestRunnerOptions
} from './request-runner';
import { DefaultProxyFactory, ProxyFactory } from './utils';
import { container, DependencyContainer } from 'tsyringe';
import { Configuration } from '@sectester/core';

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

container.register(Repeater, { useClass: DefaultRepeater });
container.register(ProxyFactory, { useClass: DefaultProxyFactory });
container.register(RepeaterServer, { useClass: DefaultRepeaterServer });
container.register(RepeaterCommands, { useClass: DefaultRepeaterCommands });
