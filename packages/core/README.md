# @secbox/core

The base package can be used to obtaining config including credentials from different sources, and provide simplified abstraction to handle integration events and commands.

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
    api: 'app.neuralegion.com',
    bus: 'EventBus'
    credentials: {
      token: 'xxxxxxx.xxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  });
```

 After that, you can inject it using `container`.

```ts
const injectedConfig = config.container.resolve(Configuration);
```

#### Options

```ts
interface ConfigurationOptions {
  bus?: string;
  api?: string;
  credentials?: Credentials;
  credentialProviders?: CredentialProvider[];
}

`bus` - key of exchange
`api` - URL that will be used to connect to the queue\
`credentials` -  credentials that are needed to get access to the queue\
`credentialProviders` - array of providers that provide credentials

#### Credentials

You have two ways to pass credentials:
  - `credentials` option
  - `credentialProviders` property

`credentials` property is the easiest way to pass credentials. You just need to pass credentials to this property.
`credentialProviders` allows you to provide credentials and load it in runtime. You can pass many providers, and credentials will be loaded from the first provider which successfully provides credentials.\
By default is present `EnvCredentialProvider`. `EnvCredentialProvider` load credentials from the environment.

```ts
import { Configuration, EnvCredentialProvider } from '@secbox/core';

const credentialsProvider = new EnvCredentialProvider();
const config = new Configuration({
    api: 'app.neuralegion.com',
    bus: 'EventBus',
    credentialProviders: [credentialsProvider]
});
```

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
