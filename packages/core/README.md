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

### Request-response
The `Command` is message that used to syncing state between Service or external services. This functionality is done by sending messages outside using a cocreate implementation of Dispatcher. Depending on the type of derived class from the Message, it might be addressed to only one consumer.

To create custom command you should exdend abstarct class `Command`

```ts
interface Request {
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  headers?: Record<string, string>
  body?: string
}

class TestCommand<R = unknown> extends Command<Request, R> {
  // implemantation
}
```

To adjust its behavior you can use next options:

|          Option          | Description                                                                                                           |
| :----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **command.payload**      | Message that we want to transmit to the remote service.                                                               |
| **command.expectReply**  | Indicates whether to wait for a reply. By default `true`.                                                             |
| **command.ttl**          | Period of time that command should be handled before being discarded. By default `10000` ms.                          |
| **command.type**         | The name of payload type. Will be taken `payload` constructor name                                                    |
| **command.corelationId** | Used to ensure atomicity while working with EventBus. By default random uuid.                                         |
| **command.createdAt**    | The exact date and time the command was created.                                                                      |


### Publish-subscribe
The `Event` is message that used to syncing state between Service or external services. This functionality is done by sending messages outside using a cocreate implementation of Dispatcher. Depending on the type of derived class from the Message, it might be addressed to multiple consumers. When a message is sent to multiple consumers, the appropriate event handler in each consumer handles the message.
 
To create a custom event you should extend abstarct class `Event`

```ts
interface Request {
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  headers?: Record<string, string>
  body?: string
}

class TestEvent extends Event<Request> {
  // implemantation
}
```

To adjust its behavior you can use next options:

|         Option         | Description                                                                                                         |
| :--------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **event.payload**      | Data that will be passed, by EventBus                                                                               |
| **event.type**         | The name of payload type. Will be taken `payload` constructor name                                                  |
| **event.corelationId** | Used to ensure atomicity while working with EventBus. By default random uuid.                                       |
| **event.createdAt**    | The date when event instans was created. By default curent time.                                                    |

### Sending messages

For instance, you can execute a command in a way that is more approach you or convenient from the client's perspective.

```ts
await new TestCommand<R>({ url, ...options, method: 'GET' }, /*...*/).execute(dispatcher);

await dispatcher.execute(new TestCommand<R>({ url, ...options, method: 'GET' }, /*...*/));
```
### Publishing events

For instance, you can fire a event in a way that is more approach you or convenient from the client's perspective.

```ts
await new TestEvent<R>({ url, ...options, method: 'GET' }, /*...*/).publish(dispatcher);

await dispatcher.publish(new TestEvent<R>({ url, ...options, method: 'GET' }, /*...*/));
```

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
