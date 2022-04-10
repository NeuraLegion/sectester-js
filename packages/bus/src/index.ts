import { ExponentialBackoffRetryStrategy } from './retry-strategies';
import { container } from 'tsyringe';
import { RetryStrategy } from '@secbox/core';

container.register(RetryStrategy, {
  useFactory: () => new ExponentialBackoffRetryStrategy({ maxDepth: 5 })
});

export * from './brokers';
export * from './retry-strategies';
