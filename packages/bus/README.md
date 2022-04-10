# @secbox/bus

The package includes a simplified implementation of the `EventBus`, one based on `RabbitMQ`, to establish synchronous and asynchronous communication between services and agents.

## Setup

```bash
npm i -s @secbox/bus
```

## Usage

#### Configuration

To use the RabbitMQ Event Bus, pass the following options object to the constructor method:

```ts
const sdkConfig = new Configuration(/*options*/);

sdkConfig.container.register(EventBusConfig, {
  useValue: {
    exchange: 'EventBus',
    clientQueue: 'agent:nnCF9MfHpbvdJVtSbQfKa1',
    connectTimeout: 10000,
    heartbeatInterval: 5000
  }
});
```

Bus configurations:

| Option              |  Type  | Description                                                                                 |
| :------------------ | :----: | ------------------------------------------------------------------------------------------- |
| `exchange`          | string | Used to associate message and queue.                                                        |
| `clientQueue`       | string | The name of the queue which will be received messages.                                      |
| `connectTimeout`    | number | Specify a timeout on blocking socket operations.                                            |
| `heartbeatInterval` | number | Defines after what period of time the peer TCP connection should be considered unreachable. |

### Subscribing to events

Provide the ability to subscribe to events, execute commands, and publish and receive events.

```ts
const sdkConfig = new Configuration(/*options*/);

// register all nedded components

sdkConfig.container.register(EventBus, { useClass: RMQEventBus });
const eventBus = sdkConfig.container.resolve(EventBus);

// event bus usage
```

#### Publishing events through the event bus

How publish event and subscribe on it you can read [here](https://github.com/NeuraLegion/secbox-sdk-js/blob/master/packages/core/README.md#publish-subscribe).

Once it is done, the bus will register corresponding handlers to listen to particular events. When any message of the expected type arrives, the bus invokes the `handle` method of the event handler that is passed to it.

To identify which handler should be invoked you should use `bind` decorator.
Single handler can handle multiple different events, and events can be handled by multiple different handlers.

#### Executing RPC methods

How send requests and gets responses you can read [here](https://github.com/NeuraLegion/secbox-sdk-js/blob/master/packages/core/README.md#request-response).

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
