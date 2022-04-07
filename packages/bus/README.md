# @secbox/bus

The package includes EventBus implementation based on RabbitMQ.

## Setup

```bash
npm i -s @secbox/bus
```

## Usage

####
You can read about sdk configuration [here](https://github.com/NeuraLegion/secbox-sdk-js/blob/master/packages/core/README.md#configuration).

### RMQEventBus

Provide the ability to subscribe to events, execute commands, and  publish and receive events.

#### Publish-subscribe

How publish event and subscribe on it you can read [here](https://github.com/NeuraLegion/secbox-sdk-js/blob/master/packages/core/README.md#publish-subscribe).

Once it is done, the bus will register corresponding handlers to listen to particular events. When any message of the expected type arrives, the bus invokes the `handle` method of the event handler that is passed to it.

To identify which handler should be invoked you should use `bind` decorator.
Single handler can handle multiple different events, and events can be handled by multiple different handlers.

#### Request-response

How send requests and gets responses you can read [here](https://github.com/NeuraLegion/secbox-sdk-js/blob/master/packages/core/README.md#request-response).

