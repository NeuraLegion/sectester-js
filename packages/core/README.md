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
  cluster: 'app.neuralegion.com',
  credentialProviders: [
    new EnvCredentialProvider()
  ]
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

Allows you to provide credentials and load it in runtime. You can pass many providers, and credentials will be loaded from the first provider which successfully provides credentials. Currently, only `EnvCredentialProvider` is accessible.

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

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
