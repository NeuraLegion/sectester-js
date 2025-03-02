import 'reflect-metadata';
import { ApiClient, FetchApiClient } from './api';
import { Configuration } from './configuration';
import { Logger } from './logger';
import { DefaultProjects } from './DefaultProjects';
import { Projects } from './Projects';
import {
  container,
  DependencyContainer,
  instancePerContainerCachingFactory,
  Lifecycle
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

    return new FetchApiClient({
      baseUrl: configuration.baseURL,
      apiKey: configuration.credentials.token,
      userAgent: `${configuration.name}/${configuration.version}`
    });
  }
});

container.register(
  Projects,
  {
    useClass: DefaultProjects
  },
  {
    lifecycle: Lifecycle.ContainerScoped
  }
);
