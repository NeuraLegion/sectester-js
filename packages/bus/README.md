# @sec-tester/bus

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

The package includes a simplified implementation of the `EventBus`, one based on `RabbitMQ`, to establish synchronous and asynchronous communication between services and agents.

## Setup

```bash
npm i -s @sec-tester/bus
```

## Usage

### Overview

To use the RabbitMQ Event Bus, pass the following options object to the constructor method:

```ts
import { Configuration } from '@sec-tester/core';
import { RMQEventBus, ExponentialBackoffRetryStrategy } from '@sec-tester/bus';

const config = new Configuration({
  hostname: 'app.neuralegion.com'
});

const repeaterId = 'your Repeater ID';

const bus = new RMQEventBus(
  config.container,
  new ExponentialBackoffRetryStrategy({ maxDepth: 5 }),
  {
    url: config.bus,
    exchange: 'EventBus',
    clientQueue: `agent:${repeaterId}`,
    appQueue: 'app',
    credentials: {
      username: 'bot',
      password: config.credentials!.token
    }
  }
);
```

The options are specific to the chosen transporter. The `RabbitMQ` implementation exposes the properties described below:

| Option              | Description                                                                          |
| :------------------ | ------------------------------------------------------------------------------------ |
| `url`               | EventBus address.                                                                    |
| `exchange`          | Exchange name which routes a message to a particular queue.                          |
| `clientQueue`       | Queue name which your bus will listen to.                                            |
| `appQueue`          | Queue name which application will listen to.                                         |
| `prefetchCount`     | Sets the prefetch count for the channel. By default, `1`                             |
| `connectTimeout`    | Time to wait for initial connect. If not specified, defaults to `heartbeatInterval`. |
| `reconnectTime`     | The time to wait before trying to reconnect. By default, `20` seconds.               |
| `heartbeatInterval` | The interval, in seconds, to send heartbeats. By default, `30` seconds.              |
| `credentials`       | The `username` and `password` to perform authentication.                             |

Finally, to establish a connection with `RabbitMQ`, you have to the `init()` method.

```ts
await bus.init();
```

In case of unrecoverable or operational errors, you will get an exception while initial connecting.

### Subscribing to events

To subscribe an event handler to the particular event, you should use the `@bind()` decorator as follows:

```ts
import { bind, EventHandler } from '@sec-tester/core';
import { injectable } from 'tsyringe';

@bind(IssueDetected)
@injectable()
class IssueDetectedHandler implements EventHandler<Issue> {
  public handle(payload: Issue): Promise<void> {
    // implementation
  }
}
```

> ⚡ Make sure that you use `@injectable()` decorator to register the corresponding provider in the IoC. Otherwise, you get an error while trying to register a handler in the `EventBus`.

Then you just need to register the handler in the `EvenBus`:

```ts
await bus.register(IssueDetectedHandler);
```

Now the `IssueDetectedHandler` event handler listens for the `IssueDetected` event. As soon as the `IssueDetected` event appers,
the `EventBus` will call the `handle()` method with the payload passed from the application.

To remove subscription, and removes the event handler, you have to call the `unregister()` method:

```ts
await bus.unregister(IssueDetectedHandler);
```

#### Publishing events through the event bus

The `EventBus` exposes a `publish()` method. This method publishes an event to the message broker.

```ts
interface Payload {
  status: 'connected' | 'disconnected';
}

class StatusChanged extends Event<Payload> {
  constructor(payload: Payload) {
    super(payload);
  }
}

const event = new StatusChanged({ status: 'connected' });

await bus.publish(event);
```

The `publish()` method takes just a single argument, an instance of the derived class of the `Event`.

> ⚡ The class name should match one defined event in the application. Otherwise, you should override it by passing the expected name via the constructor.

For more information, please see `@sec-tester/core`.

#### Executing RPC methods

The `EventBus` exposes a `execute()` method. This method is intended to perform a command to the application and returns an `Promise` with its response.

```ts
interface Payload {
  version: string;
}

interface Response {
  lastVersion: string;
}

class CheckVersion extends Command<Payload, Response> {
  constructor(payload: Payload) {
    super(payload);
  }
}

const command = new CheckVersion({ version: '0.0.1' });

const response = await bus.execute(command);
```

This method returns a `Promise` which will eventually be resolved as a response message.

For instance, if you do not expect any response, you can easily make the `EventBus` resolve a `Promise` immediately to undefined:

```ts
class Record extends Command<Payload> {
  public readonly expectReply = false;

  constructor(payload: Payload) {
    super(payload);
  }
}

const command = new Record({ version: '0.0.1' });

await bus.execute(command);
```

The `HttpCommandDispatcher` is an alternative way to execute the commands over HTTP. To start, you should create an `HttpCommandDispatcher` instance by passing the following options to the constructor:

```ts
import {
  HttpCommandDispatcher,
  HttpCommandDispatcherConfig
} from '@sec-tester/bus';

const options: HttpCommandDispatcherConfig = {
  baseUrl: 'https://app.neuralegion.com',
  token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0'
};

const httpDispatcher = new HttpCommandDispatcher(options);
```

The command dispatcher can be customized using the following options:

| Option    | Description                                                                                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `baseUrl` | Base URL for your application instance, e.g. `https://app.neuralegion.com`                                                                                                                                                                                                                                                                 |
| `token`   | API key to access the API. Find out how to obtain [personal](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens) and [organization](https://docs.brightsec.com/docs/manage-your-organization#manage-organization-apicli-authentication-tokens) API keys in the knowledgebase |
| `timeout` | Time to wait for a server to send response headers (and start the response body) before aborting the request. Default 10000 ms                                                                                                                                                                                                             |
| `rate`    | Set how many requests per interval should perform immediately, others will be delayed automatically. By default, 10 requests per 1 minute                                                                                                                                                                                                  |

Then you have to create an instance of `HttpRequest` instead of a custom command, specifying the `url` and `method` in addition to the `payload` that a command accepts by default:

```ts
const command = new HttpCommand({
  url: '/api/v1/repeaters',
  method: 'POST',
  payload: { name: 'test' }
});
```

Once it is done, you can perform a request using `HttpComandDispatcher` as follows:

```ts
const response: { id: string } = await httpDispatcher.execute(command);
```

Below you will find a list of parameters that can be used to configure a command:

| Option          | Description                                                                                |
| --------------- | ------------------------------------------------------------------------------------------ |
| `url`           | Absolute URL or path that will be used for the request. By default, `/`                    |
| `method`        | HTTP method that is going to be used when making the request. By default, `GET`            |
| `params`        | Use to set query parameters.                                                               |
| `payload`       | Message that we want to transmit to the remote service.                                    |
| `expectReply`   | Indicates whether to wait for a reply. By default true.                                    |
| `ttl`           | Period of time that command should be handled before being discarded. By default 10000 ms. |
| `type`          | The name of a command. By default, it is the name of specific class.                       |
| `correlationId` | Used to ensure atomicity while working with EventBus. By default, random UUID.             |
| `createdAt`     | The exact date and time the command was created.                                           |

For more information, please see `@sec-tester/core`.

#### Retry Strategy

For some noncritical operations, it is better to fail as soon as possible rather than retry a coupe of times.
For example, it is better to fail right after a smaller number of retries with only a short delay between retry attempts, and display a message to the user.

By default, you can use the [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) retry strategy to retry an action when errors like `ETIMEDOUT` appear.

You can implement your own to match the business requirements and the nature of the failure:

```ts
export class CustomRetryStrategy implements RetryStrategy {
  public async acquire<T extends (...args: unknown[]) => unknown>(
    task: T
  ): Promise<ReturnType<T>> {
    let times = 0;

    for (;;) {
      try {
        return await task();
      } catch {
        times++;

        if (times === 3) {
          throw e;
        }
      }
    }
  }
}
```

Once a retry strategy is implemented, you can use it like that:

```ts
const retryStrategy = new CustomRetryStrategy();

const bus = new RMQEventBus(container, retryStrategy, options);
```

## License

Copyright © 2022 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
