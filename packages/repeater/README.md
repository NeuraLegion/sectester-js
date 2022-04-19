# @secbox/repeater

Package to manage repeaters and their lifecycle.

Repeaters are mandatory for scanning targets on a local network.
More info about [repeaters](https://docs.brightsec.com/docs/on-premises-repeater-local-agent).

## Setup

```bash
npm i -s @secbox/repeater
```

## Usage

### Entities

`RepeaterFactory` is responsible for creating instances of the repeater,
encapsulating a bus and other dependencies.

```ts
class RepeaterFactory {
  public async createRepeater({
    name,
    description
  }?: RepeaterOptions): Promise<Repeater> {
    /* */
  }
}
```

Created `Repeater` instance has `start()` and `stop()` methods

```ts
class Repeater {
  public readonly repeaterId: string;

  public async start(): Promise<void> {
    /* */
  }
  public async stop(): Promise<void> {
    /* */
  }
}
```

Under the hood `Repeater` register `ExecuteRequestEventHandler` in bus,
which in turn uses `RequestRunner` to proceed with request.

```ts
export interface RequestRunner {
  protocol: Protocol;
  run(request: Request): Promise<Response>;
}
```

Package contains implementation for HTTP and WebSocket runners:`HttpRequestRunner` and `WsRequestRunner`.

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

## Limitations

Custom scripts and self-signed certificates
(see [NexPloit CLI](https://www.npmjs.com/package/@neuralegion/nexploit-cli)) are not supported yet.

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
