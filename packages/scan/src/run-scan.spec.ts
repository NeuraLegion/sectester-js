/* eslint-disable no-console */
import 'reflect-metadata';
import { Scans, TestType } from './Scans';
import { DefaultScans } from './DefaultScans';
import { ScanFactory } from './ScanFactory ';
import {
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig
} from '@secbox/bus';
import { CommandDispatcher, Configuration } from '@secbox/core';

const initConfiguration = (): Configuration => {
  const configuration = new Configuration({
    cluster: 'development.playground.neuralegion.com',
    credentials: {
      token: 'uqm5ijt.nexp.uk60x9dr4bkjpfcxohwmxagdmdsbpp7e'
    }
  });

  configuration.container.register(HttpCommandDispatcherConfig, {
    useValue: {
      baseUrl: 'https://development.playground.nexploit.app',
      token: configuration.credentials?.token as string
    }
  });

  configuration.container
    .register(CommandDispatcher, {
      useClass: HttpCommandDispatcher
    })
    .register(Scans, {
      useClass: DefaultScans
    });

  return configuration;
};

describe('scan', () => {
  it('test', async () => {
    try {
      const config = initConfiguration();

      const scanFactory = new ScanFactory(config);

      const result = await scanFactory.createScan({
        name: 'test',
        target: {
          url: 'https://brokencrystals.com'
        },
        tests: [TestType.DOM_XSS]
      });

      result;
    } catch (err) {
      err;
      throw err;
    }

    expect(true).toEqual(true);
  });
});
