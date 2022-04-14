import 'reflect-metadata';
import { Repeater, RepeaterFactory } from './lib';
import {
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig
} from '@secbox/bus';
import { CommandDispatcher, Configuration } from '@secbox/core';

/* eslint-disable no-console */

run()
  .then((repeater: Repeater) =>
    console.log(`Running repeater with id ${repeater.repeaterId}...`)
  )
  .catch(err => console.log('Repeater running error', err));

async function run(): Promise<Repeater> {
  const configuration = await initConfiguration();
  const repeater = await new RepeaterFactory(configuration).createRepeater();
  await repeater.start();

  return repeater;
}

async function initConfiguration(): Promise<Configuration> {
  const configuration = new Configuration({
    cluster: 'development.playground.neuralegion.com'
  });

  await configuration.loadCredentials();

  configuration.container.register(HttpCommandDispatcherConfig, {
    useValue: {
      baseUrl: 'https://development.playground.nexploit.app',
      token: configuration.credentials?.token as string
    }
  });

  configuration.container.register(CommandDispatcher, {
    useToken: HttpCommandDispatcher
  });

  return configuration;
}
