import {
  DefaultRMQConnectionManager,
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig,
  RMQConnectionConfig,
  RMQConnectionManager
} from './dispatchers';
import {
  container,
  DependencyContainer,
  instanceCachingFactory
} from 'tsyringe';
import { CommandDispatcher, Configuration } from '@sectester/core';

container.register(CommandDispatcher, { useClass: HttpCommandDispatcher });

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

container.register(RMQConnectionManager, {
  useFactory: instanceCachingFactory(
    async (childContainer: DependencyContainer) => {
      const instance = childContainer.resolve(DefaultRMQConnectionManager);
      await instance.connect();

      return instance;
    }
  )
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
