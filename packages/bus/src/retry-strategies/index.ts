import { ExponentialBackoffRetryStrategy } from './ExponentialBackoffRetryStrategy';
import { container } from 'tsyringe';
import { RetryStrategy } from '@sectester/core';

container.register(RetryStrategy, {
  useFactory() {
    return new ExponentialBackoffRetryStrategy({ maxDepth: 5 });
  }
});

export * from './ExponentialBackoffRetryStrategy';
