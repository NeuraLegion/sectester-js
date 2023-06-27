import {
  DefaultRMQConnectionManager,
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig,
  RMQConnectionConfig,
  RMQConnectionManager
} from './dispatchers';
import { container, DependencyContainer } from 'tsyringe';
import { CommandDispatcher, Configuration } from '@sectester/core';

container.register(CommandDispatcher, { useClass: HttpCommandDispatcher });

container.register(RMQConnectionManager, {
  useClass: DefaultRMQConnectionManager
});

container.register(RMQConnectionConfig, {
  useFactory(childContainer: DependencyContainer) {
    const configuration = childContainer.resolve(Configuration);

    if (!configuration.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the dispatcher.'
      );
    }

    return {
      url: configuration.bus,
      credentials: {
        username: 'bot',
        password: configuration.credentials.token ?? ''
      }
    };
  }
});

container.register(HttpCommandDispatcherConfig, {
  useFactory(childContainer: DependencyContainer) {
    const configuration = childContainer.resolve(Configuration);

    if (!configuration.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the dispatcher.'
      );
    }

    return {
      timeout: 10000,
      baseUrl: configuration.api,
      token: configuration.credentials.token
    };
  }
});
