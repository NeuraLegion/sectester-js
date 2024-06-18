import { CommandDispatcher, RetryStrategy } from './commands';
import { Configuration } from './configuration';
import {
  ExponentialBackoffRetryStrategy,
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig
} from './dispatchers';
import { Logger } from './logger';
import {
  container,
  DependencyContainer,
  instancePerContainerCachingFactory
} from 'tsyringe';

container.register(RetryStrategy, {
  useFactory() {
    return new ExponentialBackoffRetryStrategy({ maxDepth: 5 });
  }
});

container.register(Logger, {
  useFactory: instancePerContainerCachingFactory((child: DependencyContainer) =>
    child.isRegistered(Configuration, true)
      ? new Logger(child.resolve(Configuration).logLevel)
      : new Logger()
  )
});

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
