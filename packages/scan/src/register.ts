import 'reflect-metadata';
import { Scans } from './Scans';
import { DefaultScans } from './DefaultScans';
import { ScanFactory } from './ScanFactory';
import { DefaultDiscoveries } from './DefaultDiscoveries';
import { Discoveries } from './Discoveries';
import { container, DependencyContainer } from 'tsyringe';
import { Configuration } from '@sectester/core';

container.register(Scans, { useClass: DefaultScans });
container.register(Discoveries, { useClass: DefaultDiscoveries });

container.register(ScanFactory, {
  useFactory(childContainer: DependencyContainer) {
    return new ScanFactory(childContainer.resolve(Configuration));
  }
});
