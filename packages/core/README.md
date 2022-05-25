# @sec-tester/core

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

The core package can be used to obtain a config including credentials from different sources, and provide a simplified abstraction to handle events and commands.

## Setup

```bash
npm i -s @sec-tester/core
```

## Usage

### Configuration

First, you need to generate a new instance of `Configuration`.

```ts
import { Configuration } from '@sec-tester/core';

const config = new Configuration({
  hostname: 'app.neuralegion.com',
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
  hostname: string;
  credentials?: Credentials;
  logLevel?: LogLevel;
  credentialProviders?: CredentialProvider[];
}
```

The default configuration is as follows:

```js
{
  logLevel: LogLevel.ERROR,
  credentialProviders: [new EnvCredentialProvider()];
}
```

#### hostname

- type: `string`

Set the application name (domain name), that is used to establish connection with.

```ts
import { Configuration } from '@sec-tester/core';

const config = new Configuration({
  hostname: 'app.neuralegion.com'
});
```

#### logLevel

- type: `LogLevel`

What level of logs to report. Any logs of a higher level than the setting are shown.

```ts
import { Configuration, LogLevel } from '@sec-tester/core';

const config = new Configuration({
  hostname: 'app.neuralegion.com',
  logLevel: LogLevel.ERROR
});
```

#### credentials

- type: `Credentials`

Set credentials to access the application.

```ts
import { Configuration } from '@sec-tester/core';

const config = new Configuration({
  credentials: {
    token: 'your API key'
  }
});
```

More info about [setting up an API key](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens)

#### credentialProviders

- type: `CredentialProvider[]`

Allows you to provide credentials and load it in runtime. The configuration will invoke one provider at a time and only continue to the next if no credentials have been located. For example, if the process finds values defined via the `BRIGHT_TOKEN` environment variables, the file at `.sectesterrc` will not be read.

#### EnvCredentialProvider

Use this provider to read credentials from the following environment variable: `BRIGHT_TOKEN`

If the `BRIGHT_TOKEN` environment variable is not set or contains a falsy value, it will return undefined.

```ts
import { Configuration, EnvCredentialProvider } from '@sec-tester/core';

const credentialsProvider = new EnvCredentialProvider();
const config = new Configuration({
  credentialProviders: [credentialsProvider]
});
```

### Messages

Message is used for syncing state between SDK, application and/or external services.
This functionality is done by sending messages outside using a concrete implementation of `Dispatcher`.

Depending on the type of derived class from the `Message`, it might be addressed to only one consumer or have typically multiple consumers as well.
When a message is sent to multiple consumers, the appropriate event handler in each consumer handles the message.

The `Message` is a data-holding class, but it implements a [Visitor pattern](https://en.wikipedia.org/wiki/Visitor_pattern#:~:text=In%20object%2Doriented%20programming%20and,structures%20without%20modifying%20the%20structures.)
to allow clients to perform operations on it using a visitor class (see `Dispatcher`) without modifying the source.

For instance, you can dispatch a message in a way that is more approach you or convenient from the client's perspective.

```ts
import { CommandDispatcher } from '@sec-tester/core';

const dispatcher = container.resolve(CommandDispatcher);

interface Payload {
  status: 'connected' | 'disconnected';
}

class Ping extends Command<Payload> {
  constructor(payload: Payload) {
    super(payload);
  }
}

// using a visitor pattern
await new Ping({ status: 'connected' }).execute(dispatcher);

// or directly
await dispatcher.execute(new Ping({ status: 'disconnected' }));
```

The same is applicable for the `Event`. You just need to use the `EventDispatcher` instead of `CommandDispatcher`.

Each message have a correlation ID to ensure atomicity. The regular UUID is used, but you might also want to consider other options.

### Request-response

The request-response message (aka `Command`) style is useful when you need to exchange messages between various external services.
Using `Command` you can easily ensure that the service has actually received the message and sent a response back.

To create an instance of `Command` use the abstract class as follows:

```ts
interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

class Request<R = unknown> extends Command<RequestOptions, R> {
  constructor(options: RequestOptions) {
    super(options);
  }
}
```

To adjust its behavior you can use next options:

| Option         | Description                                                                                  |
| :------------- | -------------------------------------------------------------------------------------------- |
| `payload`      | Message that we want to transmit to the remote service.                                      |
| `expectReply`  | Indicates whether to wait for a reply. By default `true`.                                    |
| `ttl`          | Period of time that command should be handled before being discarded. By default `10000` ms. |
| `type`         | The name of a command. By default, it is the name of specific class.                         |
| `corelationId` | Used to ensure atomicity while working with EventBus. By default, random UUID.               |
| `createdAt`    | The exact date and time the command was created.                                             |

### Publish-subscribe

When you just want to publish events without waiting for a response, it is better to use the `Event`.
The ideal use case for the publish-subscribe model is when you want to simply notify another service that a certain condition has occurred.

To create an instance of `Event` use the abstract class as follows:

```ts
interface Issue {
  name: string;
  details: string;
  type: string;
  cvss?: string;
  cwe?: string;
}

class IssueDetected extends Event<Issue> {
  constructor(payload: Issue) {
    super(payload);
  }
}
```

To adjust its behavior you can use next options:

| Option         | Description                                                                    |
| :------------- | ------------------------------------------------------------------------------ |
| `payload`      | Message that we want to transmit to the remote service.                        |
| `type`         | The name of a command. By default, it is the name of specific class.           |
| `corelationId` | Used to ensure atomicity while working with EventBus. By default, random UUID. |
| `createdAt`    | The exact date and time the event was created.                                 |

To create an event handler, you should implement the `Handler` interface and use the `@bind()` decorator to subscribe a handler to an event:

```ts
@bind(IssueDetected)
class IssueDetectedHandler implements EventHandler<Issue> {
  public handle(payload: Issue): Promise<void> {
    // implementation
  }
}
```

You can register multiple event handlers for a single event pattern and all of them will be automatically triggered in parallel.

```ts
@bind(IssueDetected, IssueReopened)
class IssueDetectedHandler implements EventHandler<Issue> {
  public handle(payload: Issue): Promise<void> {
    // implementation
  }
}
```

You can also use a string and symbol to subscribe a handler to events:

```ts
const IssueReopened = Symbol('IssueReopened');

@bind('IssueDetected', IssueReopened)
class IssueDetectedHandler implements EventHandler<Issue> {
  public handle(payload: Issue): Promise<void> {
    // implementation
  }
}
```

As soon as the `IssueDetected` event appears, the event handler takes a single argument, the data passed from the client (in this case, an event payload which has been sent over the network).

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
