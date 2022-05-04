import { EventBusFactory } from './EventBusFactory';
import { RepeaterEventBusFactory } from './RepeaterEventBusFactory';
import { container, DependencyContainer } from 'tsyringe';
import { Configuration, RetryStrategy } from '@sec-tester/core';

container.register(EventBusFactory, {
  useFactory(childContainer: DependencyContainer) {
    const configuration = childContainer.resolve(Configuration);
    const retryStrategy = childContainer.resolve<RetryStrategy>(RetryStrategy);

    return new RepeaterEventBusFactory(
      childContainer,
      configuration,
      retryStrategy
    );
  }
});
