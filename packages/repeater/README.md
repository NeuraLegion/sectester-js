# @secbox/repeater

Package to manage repeaters and their lifecycle.

Repeaters are mandatory for scanning targets on a local network.
More info about [repeaters](https://docs.brightsec.com/docs/on-premises-repeater-local-agent).

## Setup

```bash
npm i -s @secbox/repeater
```

## Usage

`RepeaterFactory` exported by this package can be constructed with [`Configuration` instance](https://github.com/NeuraLegion/secbox-sdk-js/tree/master/packages/core#configuration) as constructor argument.

It has a method `createRepeater()` which returns a `Repeater` instance.

`Repeater` instance has two methods (`start()` and `stop()`) and a `repeaterId` field, that is required in scan config for local targets.

### Usage in unit tests

```ts
import { Configuration } from '@secbox/core';
import { RepeaterFactory, Repeater } from '@secbox/repeater';

describe('Scan', () => {
  let repeater: Repeater;

  beforeAll(async () => {
    const configuration = new Configuration({
      cluster: 'development.playground.neuralegion.com'
    });

    repeater = await new RepeaterFactory(configuration).createRepeater();
    await repeater.start();
  });

  afterAll(async () => {
    await repeater.stop();
  });

  it('should be not vulnerable', () => {
    /* run scan of local target passing `repeater.repeaterId` to scan config */
  });
});
```

### Implementation details

Under the hood `Repeater` register `ExecuteRequestEventHandler` in bus,
which in turn uses `RequestRunner` to proceed with request.

```ts
export interface RequestRunner {
  protocol: Protocol;
  run(request: Request): Promise<Response>;
}
```

Package contains `RequestRunner` implementations for HTTP and WS protocols.
To support other protocol new class implementation of `RequestRunner` should be registered in global IoC contatiner:

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
