import { Configuration } from './configuration';
import { Logger } from './logger';
import {
  container,
  DependencyContainer,
  instancePerContainerCachingFactory
} from 'tsyringe';

container.register(Logger, {
  useFactory: instancePerContainerCachingFactory((child: DependencyContainer) =>
    child.isRegistered(Configuration, true)
      ? new Logger(child.resolve(Configuration).logLevel)
      : new Logger()
  )
});
