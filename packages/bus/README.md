# @secbox/bus

The package includes a simplified implementation of the `EventBus`, one based on `RabbitMQ`, to establish synchronous and asynchronous communication between services and agents.

## Setup

```bash
npm i -s @secbox/bus
```

## Usage

### Overview

To use the RabbitMQ Event Bus, pass the following options object to the constructor method:

```ts
import { RMQEventBus, ExponentialBackoffRetryStrategy } from '@secbox/bus';

const config = new Configuration({
  cluster: 'app.neuralegion.com'
});

const repeaterId = 'your Repeater ID';
const token = 'your API key';

const bus = new RMQEventBus(
  config.container,
  new ExponentialBackoffRetryStrategy({ maxDepth: 5 }),
  {
    exchange: 'EventBus',
    clientQueue: `agent:${repeaterId}`,
    appQueue: 'app',
    credentials: {
      username: 'bot',
      password: token
    }
  }
);
```

The options are specific to the chosen transporter. The `RabbitMQ` implementation exposes the properties described below:

| Option              | Description                                                                          |
| :------------------ | ------------------------------------------------------------------------------------ |
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
import { bind, EventHandler } from '@secbox/core';
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

For more information, please see `@secbox/core`.

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

For more information, please see `@secbox/core`.

### HttpCommandDispatcher

The `HttpCommandDispatcher` is an alternative way to execute the commands over HTTP. To start, you should create an `HttpCommandDispatcher` instance by passing the following options to the constructor:

```ts
import { HttpCommandDispatcher, HttpCommandDispatcherConfig } from '@secbox/bus';

const options: HttpCommandDispatcherConfig = {
  baseUrl: 'https://app.neuralegion.com',
  token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0',
};
  
const httpDispatcher = new HttpCommandDispatcher(options);
```
The command dispatcher can be customized using the following options:

| Option    | Description                                                                                                                                          |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl` |  Base URL for your application instance, e.g. `https://app.neuralegion.com`                                                                          |
| `token`   | API key to access the API. Find out how to obtain [personal](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens) and [organization](https://docs.brightsec.com/docs/manage-your-organization#manage-organization-apicli-authentication-tokens) API keys in the knowledgebase                                                                                                                                  |
| `timeout` | If the request takes longer than `timeout`, the request will be aborted. Default 10000                                                               |
| `rate`    | Set how many requests per interval should perform immediately, others will be delayed automatically. By default, 10 requests per 1 minute |

To execute command `HttpComandDispatcher` exposes a `execute()` method. This method is intended to perform a command to the application and returns a `Promise` with its response.

```ts
interface Payload {
  version: string;
}

interface Response {
  lastVersion: string;
}

const options: HttpOptions<Payload> = {
  payload: { version: '0.0.1' },
  url: '/api/test',
  method: 'GET'
};
      
const command = new HttpRequest<Payload, Response>(options);

const response = await httpDispatcher.execute(command);
```
This method returns a Promise which will eventually be resolved as a response message.

As you can see in example above to configure your http command you should pass `HttpOptions<T>` to `HttpCommand<T, R>` constructor.

The `HttpOptions<T>` implementation exposes the properties described below:

| Option          | Description                                                                                |
|-----------------|--------------------------------------------------------------------------------------------|
| `url`           | Application URL address                                                                    |
| `payload`       | Message that we want to transmit to the remote service.                                    |
| `method`        | HTTP method                                                                                |
| `expectReply`   | ndicates whether to wait for a reply. By default true.                                     |
| `ttl`           | Period of time that command should be handled before being discarded. By default 10000 ms. |
| `type`          | The name of a command. By default, it is the name of specific class.                       |
| `correlationId` | Used to ensure atomicity while working with EventBus. By default, random UUID.             |
| `params`        | Query parameters                                                                           |
| `createdAt`     | The exact date and time the command was created.                                           |

#### Custom HttpComandDispatcher

You can implement your own `HttpCommandDispatcher`. To do it you should implement `ComandDispatcher` interface.

```ts
import { Command, ComandDispatcher } from '@secbox/core';

export class CustomHttpDispather implements ComandDispatcher {
  constuctor(/*options*/) {
    // ...
  }
  
  publick execute<T, R>(command: Command<T, R>): Promise<R> {
    const { url, method, payload } = command;
  
    // implementation based on your http client
  }
}
```
For more information, please see @secbox/core.

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

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
