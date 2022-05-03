# @sec-tester/repeater

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

Package to manage repeaters and their lifecycle.

Repeaters are mandatory for scanning targets on a local network.
More info about [repeaters](https://docs.brightsec.com/docs/on-premises-repeater-local-agent).

## Setup

```bash
npm i -s @sec-tester/repeater
```

## Usage

To establish a secure connection between the Bright cloud engine and a target on a local network, you just need to use the `RepeaterFactory` constructed with [`Configuration` instance](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/core#configuration) as constructor argument.

```ts
const configuration = new Configuration({
  cluster: 'app.neuralegion.com'
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
  namePrefix: 'my-repeater',
  description: 'My repeater'
});
```

The `createRepeater` method accepts the options described below:

| Option                 | Description                                                                                            |
| :--------------------- | ------------------------------------------------------------------------------------------------------ |
| `namePrefix`           | Enter a name prefix that will be used as a constant part of the unique name. By default, `sec-tester`. |
| `description`          | Set a short description of the Repeater.                                                               |
| `requestRunnerOptions` | Custom the request runner settings that will be used to execute requests to your application.          |

The default `requestRunnerOptions` is as follows:

```js
{
  timeout: 30000,
  maxContentLength: 100,
  reuseConnection: false,
  whitelistMimes: [
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
  whitelistMimes?: string[];
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
import { Configuration } from '@sec-tester/core';
import { RepeaterFactory, Repeater } from '@sec-tester/repeater';

describe('Scan', () => {
  let repeater!: Repeater;

  beforeAll(async () => {
    const configuration = new Configuration({
      cluster: 'app.neuralegion.com'
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

Under the hood `Repeater` register `ExecuteRequestEventHandler` in bus,
which in turn uses the `RequestRunner` to proceed with request:

```ts
export interface RequestRunner {
  protocol: Protocol;
  run(request: Request): Promise<Response>;
}
```

Package contains `RequestRunner` implementations for both HTTP and WS protocols.
To support other protocol new class implementation of `RequestRunner` should be registered in global IoC container:

```ts
import { container } from 'tsyringe';

container.register(RequestRunner, {
  useClass: CustomProtocolRequestRunner
});
```

## Limitations

Custom scripts and self-signed certificates
(see [NexPloit CLI](https://www.npmjs.com/package/@neuralegion/nexploit-cli)) are not supported yet.

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
