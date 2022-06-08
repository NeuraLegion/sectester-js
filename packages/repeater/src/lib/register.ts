import { RepeaterFactory } from './RepeaterFactory';
import { container, DependencyContainer } from 'tsyringe';
import { Configuration } from '@sectester/core';

container.register(RepeaterFactory, {
  useFactory(childContainer: DependencyContainer) {
    return new RepeaterFactory(childContainer.resolve(Configuration));
  }
});
