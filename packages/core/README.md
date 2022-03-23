# @secbox/core

The base package can be used to scan local targets, without exposing them to the internet.

## Setup

```bash
npm i @secbox/core
```

## Usage

### Configuration

First, you need to generate a new instance of `Configuration`.

```ts
import { Configuration } from '@secbox/core';

const config = new Configuration({
    api: 'amqps://{url}:{port}',
    bus: '{bus-name}',
    clientQeueu: `{queue-name}`,
    connectTimeout: 10000,
    heartbeatInterval: 5000,
    reconnectTime: 5000,
    credentials: {
      username: '{username}',
      token: '{token}'
    }
  });
```

 After that, you can inject it using `container`.

```ts
import { Configuration, container } from '@secbox/core';

const injectedConfig = container.resolve(Configuration);
```

#### Credentials

You can pass credentials to the configuration using `credentials` property, or use `credentialProviders` property to passed array of credential providers.
The credential provider should implement `CredentialProvider` interface.
