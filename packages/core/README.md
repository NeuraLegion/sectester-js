# @sectester/core

[![Maintainability](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/maintainability)](https://codeclimate.com/github/NeuraLegion/sectester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/test_coverage)](https://codeclimate.com/github/NeuraLegion/sectester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sectester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sectester/core)

The core package can be used to obtain a config including credentials from different sources, and provide a simplified abstraction to handle events and commands.

## Setup

```bash
npm i -s @sectester/core
```

## Usage

### Configuration

First, you need to generate a new instance of `Configuration`.

```ts
import { Configuration } from '@sectester/core';

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
import { Configuration } from '@sectester/core';

const config = new Configuration({
  hostname: 'app.neuralegion.com'
});
```

#### logLevel

- type: `LogLevel`

What level of logs to report. Any logs of a higher level than the setting are shown.

```ts
import { Configuration, LogLevel } from '@sectester/core';

const config = new Configuration({
  // ...
  logLevel: LogLevel.ERROR
});
```

#### credentials

- type: `Credentials`

Set credentials to access the application.

```ts
import { Configuration } from '@sectester/core';

const config = new Configuration({
  // ...
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
import { Configuration, EnvCredentialProvider } from '@sectester/core';

const credentialsProvider = new EnvCredentialProvider();
const config = new Configuration({
  // ...
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
import { CommandDispatcher, Command } from '@sectester/core';
import { container } from 'tsyringe';

const dispatcher = container.resolve(CommandDispatcher);

interface Payload {
  status: 'connected' | 'disconnected';
}

class Ping extends Command<Payload, undefined> {
  constructor(payload: Payload) {
    super(payload);
  }
}

// using a visitor pattern
await new Ping({ status: 'connected' }).execute(dispatcher);

// or directly
await dispatcher.execute(new Ping({ status: 'disconnected' }));
```

Each message have a correlation ID to ensure atomicity. The regular UUID is used, but you might also want to consider other options.

### Request-response

The request-response message (aka `Command`) style is useful when you need to exchange messages between various external services.
Using `Command` you can easily ensure that the service has actually received the message and sent a response back.

To create an instance of `Command` use the abstract class as follows:

```ts
import { Command } from '@sectester/core';

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
| `corelationId` | Used to ensure atomicity. By default, random UUID.                                           |
| `createdAt`    | The exact date and time the command was created.                                             |

## License

Copyright © 2022 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
