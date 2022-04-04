# @secbox/core

The core package can be used to obtain a config including credentials from different sources, and provide a simplified abstraction to handle events and commands.

## Setup

```bash
npm i -s @secbox/core
```

## Usage

### Configuration

First, you need to generate a new instance of `Configuration`.

```ts
import { Configuration } from '@secbox/core';

const config = new Configuration({
  cluster: 'app.neuralegion.com',
  credentials: {
    token: 'your API key'
  }
});
```

After that, you can resolve the configuration using the IoC container.

```ts
const config = config.container.resolve(Configuration);
```

#### Options

Configuration can be customized using the following options:

```ts
export interface ConfigurationOptions {
  cluster: string;
  credentials?: Credentials;
  credentialProviders?: CredentialProvider[];
}
```

The default configuration is as follows:

```js
{
  credentialProviders: [new EnvCredentialProvider()];
}
```

#### cluster

- type: `string`

Set the application name (domain name), that is used to establish connection with. By default, the option is equal to `app.neuralegion.com`.

```ts
import { Configuration } from '@secbox/core';

const config = new Configuration({
  cluster: 'app.neuralegion.com'
});
```

#### credentials

- type: `Credentials`

Set credentials to access the application.

```ts
import { Configuration } from '@secbox/core';

const config = new Configuration({
  credentials: {
    token: 'your API key'
  }
});
```

More info about [setting up an API key](https://docs.neuralegion.com/docs/manage-your-organization#manage-organization-apicli-authentication-tokens)

#### credentialProviders

- type: `CredentialProvider[]`

Allows you to provide credentials and load it in runtime. The configuration will invoke one provider at a time and only continue to the next if no credentials have been located. For example, if the process finds values defined via the `BRIGHT_TOKEN` environment variables, the file at `.secboxrc` will not be read.

#### EnvCredentialProvider

Use this provider to read credentials from the following environment variable: `BRIGHT_TOKEN`

If the `BRIGHT_TOKEN` environment variable is not set or contains a falsy value, it will return undefined.

```ts
import { Configuration, EnvCredentialProvider } from '@secbox/core';

const credentialsProvider = new EnvCredentialProvider();
const config = new Configuration({
  credentialProviders: [credentialsProvider]
});
```

### Command

Abstract class which one should extend your command class.

```ts
export class Test<T, R> extend Command<T, R> {
  // ...
}
```

The Command can be executed in a way that is more approach you or convenient from the client's perspective.

```ts
await new Command<T, R>(/*parameters*/).execute(dispatcher);
await dispatcher.execute(new Command<T, R>(/*parameters*/));
```

`Command` should be used in the case when you need execute NeuraLegion application command. For example registred repeater.

```ts
export class RegisterRepeater {
  constructor(
    public readonly repeaterId: string,
    public readonly version: string,
    public readonly localScriptsUsed: boolean
  ) {}
}

await new Command(new RegisterRepeater(repeaterId, version, false)).execute(
  dispatcher
);
```

Command can be execute synchroniouse, to do it you should set `expectReply` to `true`.

|           Option           | Description                                                                                  |
| :------------------------: | -------------------------------------------------------------------------------------------- |
|   **_command.payload_**    | Message that we want to transmit to the remote service.                                      |
| **_command.expectReply_**  | Indicates whether to wait for a reply. By default `true`.                                    |
|     **_command.ttl_**      | Period of time that command should be handled before being discarded. By default `10000` ms. |
|     **_command.type_**     | The name of payload type. Will be taken `payload` constructor name                           |
| **_command.corelationId_** | ID that used to join response to the command.                                                |
|  **_command.createdAt_**   | The exact date and time the command was created.                                             |

### Event

Abstract class which one should extend your event class.

```ts
export class Test<T> extend Event<T> {
  // ...
}
```

The `Event` can be executed in a way that is more approach you or convenient from the client's perspective.

```ts
await new Event<T>(/*parameters*/).execute(dispatcher);
await dispatcher.execute(new Event<T>(/*parameters*/));
```

`Event` should be used in case when you need to update NeuraLegion application component state.

```ts
export class RepeaterStatusUpdated {
  constructor(
    public readonly repeaterId: string,
    public readonly status: 'connected' | 'disconnected'
  ) {}
}

await new Event(new RepeaterStatusUpdated(repeaterId, 'connected')).publish(
  dispatcher
);
```

|          Option          | Description                                                           |
| :----------------------: | --------------------------------------------------------------------- |
|   **_event.payload_**    | Data that will be passed, by EventBus                                 |
|     **_event.type_**     | The name of payload type. Will be taken `payload` constructor name    |
| **_event.corelationId_** | Id that used to join response to the command. By default random uuid. |
|  **_event.createdAt_**   | The date when command instans was created. By default curent time.    |

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
