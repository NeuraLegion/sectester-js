import { ApiClient, FetchApiClient } from './api';
import { Configuration } from './configuration';
import { Logger } from './logger';
import {
  container,
  DependencyContainer,
  instancePerContainerCachingFactory
} from 'tsyringe';

container.register(Logger, {
  useFactory: instancePerContainerCachingFactory(
    (child: DependencyContainer) =>
      child.isRegistered(Configuration, true)
        ? new Logger(child.resolve(Configuration).logLevel)
        : new Logger()
  )
});

container.register(ApiClient, {
  useFactory(childContainer: DependencyContainer) {
    const configuration = childContainer.resolve(Configuration);

    if (!configuration.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the API.'
      );
    }

    return new FetchApiClient({
      baseUrl: configuration.api,
      apiKey: configuration.credentials.token
    });
  }
});
