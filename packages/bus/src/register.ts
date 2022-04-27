import {
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig
} from './dispatchers';
import { container, DependencyContainer } from 'tsyringe';
import { CommandDispatcher, Configuration } from '@secbox/core';

container.register(CommandDispatcher, { useClass: HttpCommandDispatcher });

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