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
  hostname: 'app.brightsec.com',
  projectId: 'your project ID',
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
  hostname?: string;
  projectId?: string;
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

Set the hostname (domain name) used to establish a connection.

```ts
import { Configuration } from '@sectester/core';

const config = new Configuration({
  hostname: 'app.brightsec.com'
});
```

> [!NOTE]
> If you omit the `hostname` parameter, 'app.brightsec.com' will be used by default.

#### projectId

- type: `string`

Set the ID of the project you want to work with.

```ts
import { Configuration } from '@sectester/core';

const config = new Configuration({
  // ...
  projectId: 'your project ID'
});
```

> [!TIP]
> The project ID can be found in the URL of the project page. For example, in the URL `https://app.brightsec.com/projects/1234`, the project ID is `1234`. We recommend using the dedicated project ID for each application.

> [!WARNING]
> If you omit the `projectId` parameter, we will use the default project ID. This is not recommended especially if you have multiple projects.

#### logLevel

- type: `LogLevel`

Set the maximum log level to report.

```ts
import { Configuration, LogLevel } from '@sectester/core';

const config = new Configuration({
  // ...
  logLevel: LogLevel.ERROR
});
```

#### credentials

- type: `Credentials`

Set credentials for accessing the application.

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

Allows you to provide credentials that are loaded at runtime. The configuration will invoke one provider at a time and only continue to the next if no credentials have been located. For example, if the process finds values defined via the `BRIGHT_TOKEN` environment variables, the file at `.sectesterrc` will not be read.

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

### ApiClient

The `ApiClient` interface and its implementation `FetchApiClient` provide a robust way to handle HTTP requests with built-in retry logic, rate limiting, and error handling.

```ts
import { FetchApiClient } from '@sectester/core';

const client = new FetchApiClient({
  baseUrl: 'https://app.brightsec.com',
  apiKey: 'your-api-key',
  timeout: 5000 // optional, defaults to 5000ms
});

// Make a request
const response = await client.request('/api/v1/scans');
```

The `FetchApiClient` includes the following features:

- Automatic retry for idempotent requests (GET, HEAD, PUT, DELETE, OPTIONS, TRACE)
- Rate limiting handling with automatic retry based on 'Retry-After' header
- Configurable timeout
- API key authentication
- Automatic handling of redirects (status 409)
- JSON content type by default

The client can be configured using the following options:

| Option       | Type                                         | Default                                                      | Description                             |
| ------------ | -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| baseUrl      | string                                       | -                                                            | Base URL for all API requests           |
| apiKey       | string                                       | -                                                            | API key for authentication              |
| apiKeyPrefix | string                                       | 'Api-Key'                                                    | Prefix used in the Authorization header |
| timeout      | number                                       | 5000                                                         | Request timeout in milliseconds         |
| userAgent    | string                                       | sectester-js/<version>                                       | User agent string                       |
| retry        | [RetryOptions](./src/api/RetryHandler.ts#L5) | See [FetchApiClient.ts](./src/api/FetchApiClient.ts#L32-L35) | Retry options for the client            |

## License

Copyright © 2025 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
