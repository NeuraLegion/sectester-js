import { Configuration } from './configuration';
import { Logger } from './logger';
import { container, DependencyContainer } from 'tsyringe';

container.register(Logger, {
  useFactory(child: DependencyContainer): Logger {
    return child.isRegistered(Configuration, true)
      ? new Logger(child.resolve(Configuration).logLevel)
      : new Logger();
  }
});
