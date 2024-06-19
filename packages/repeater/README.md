# @sectester/repeater

[![Maintainability](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/maintainability)](https://codeclimate.com/github/NeuraLegion/sectester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/test_coverage)](https://codeclimate.com/github/NeuraLegion/sectester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sectester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sectester/core)

Package to manage repeaters and their lifecycle.

Repeaters are mandatory for scanning targets on a local network.
More info about [repeaters](https://docs.brightsec.com/docs/on-premises-repeater-local-agent).

## Setup

```bash
npm i -s @sectester/repeater
```

## Usage

To establish a secure connection between the Bright cloud engine and a target on a local network, you just need to use the `RepeaterFactory` constructed with [`Configuration` instance](https://github.com/NeuraLegion/sectester-js/tree/master/packages/core#configuration) as constructor argument.

```ts
import { Configuration } from '@sectester/core';
import { RepeaterFactory } from '@sectester/repeater';

const configuration = new Configuration({
  hostname: 'app.neuralegion.com'
});

const repeaterFactory = new RepeaterFactory(configuration);
```

The factory exposes the `createRepeater` method that returns a new `Repeater` instance:

```ts
const repeater = await repeaterFactory.createRepeater();
```

You can customize some properties, e.g. name prefix or description, passing options as follows:

```ts
const repeater = await repeaterFactory.createRepeater({
  namePrefix: 'my-repeater'
});
```

The `createRepeater` method accepts the options described below:

| Option                        | Description                                                                                                       |
| :---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `namePrefix`                  | Enter a name prefix that will be used as a constant part of the unique name. By default, the hostname value used. |
| `disableRandomNameGeneration` | Disable random name generation for the Repeater's name.                                                           |
| `requestRunnerOptions`        | Custom the request runner settings that will be used to execute requests to your application.                     |

The default `requestRunnerOptions` is as follows:

```js
{
  timeout: 30000,
  maxContentLength: 100,
  reuseConnection: false,
  allowedMimes: [
    'text/html',
    'text/plain',
    'text/css',
    'text/javascript',
    'text/markdown',
    'text/xml',
    'application/javascript',
    'application/x-javascript',
    'application/json',
    'application/xml',
    'application/x-www-form-urlencoded',
    'application/msgpack',
    'application/ld+json',
    'application/graphql'
  ]
};
```

The `RequestRunnerOptions` exposes the following options that can used to customize the request runner's behavior:

```ts
export interface RequestRunnerOptions {
  timeout?: number;
  proxyUrl?: string;
  headers?: Record<string, string | string[]>;
  allowedMimes?: string[];
  maxContentLength?: number;
  reuseConnection?: boolean;
}
```

The `Repeater` instance provides the `start` method. This method is required to establish a connection with the Bright cloud engine and interact with other services.

```ts
await repeater.start();
```

To dispose of the connection, stop accepting any incoming commands, and handle events, you can call the `stop` method if the `Repeater` instance is started:

```ts
await repeater.stop();
```

`Repeater` instance also has a `repeaterId` field, that is required to start a new scan for local targets.

### Usage in unit tests

There are multiple strategies of how to run a repeater: before-all or before-each (recommended).
The two most viable options are running before all the tests vs running before every single test.

Below you can find the implementation of before-each strategy:

```ts
import { Configuration } from '@sectester/core';
import { RepeaterFactory, Repeater } from '@sectester/repeater';

describe('Scan', () => {
  let repeater!: Repeater;

  beforeAll(async () => {
    const configuration = new Configuration({
      hostname: 'app.neuralegion.com'
    });

    repeater = await new RepeaterFactory(configuration).createRepeater();
    await repeater.start();
  });

  afterAll(() => repeater.stop());

  it('should be not vulnerable', () => {
    // run scan of local target passing `repeater.repeaterId` to scan config
  });
});
```

### Implementation details

Under the hood `Repeater` connects to the Bright engine using web socket protocol, then listens for incoming commands from the engine.
Which in turn get executed with the `RequestRunner` to proceed with the request coming from the engine:

```ts
export interface RequestRunner {
  protocol: Protocol;
  run(request: Request): Promise<Response>;
}
```

Package contains `RequestRunner` implementations for HTTP protocol only.
To support other protocol new class implementation of `RequestRunner` should be registered in global IoC container:

```ts
import { container } from 'tsyringe';

container.register(RequestRunner, {
  useClass: CustomProtocolRequestRunner
});
```

## Limitations

Custom scripts and self-signed certificates
(see [Bright CLI](https://www.npmjs.com/package/@brightsec/cli)) are not supported yet.

## License

Copyright © 2022 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
