# @sectester/runner

[![Maintainability](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/maintainability)](https://codeclimate.com/github/NeuraLegion/sectester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/test_coverage)](https://codeclimate.com/github/NeuraLegion/sectester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sectester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sectester/core)

Run scanning for vulnerabilities just from your unit tests on CI phase.

## Setup

```bash
npm i -s @sectester/runner
```

## Step-by-step guide

### Configure SDK

To start writing tests, first obtain a Bright token, which is required for the access to Bright API. More info about [setting up an API key](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens).

Then put obtained token into `BRIGHT_TOKEN` environment variable to make it accessible by default [`EnvCredentialProvider`](https://github.com/NeuraLegion/sectester-js/tree/master/packages/core#envcredentialprovider).

> Refer to `@sectester/core` package [documentation](https://github.com/NeuraLegion/sectester-js/tree/master/packages/core#credentials) for the details on alternative ways of configuring credential providers.

Once it is done, create a configuration object. Single required option is Bright `hostname` domain you are going to use, e.g. `app.brightsec.com` as the main one:

```ts
import { Configuration } from '@sectester/core';

const configuration = new Configuration({ hostname: 'app.brightsec.com' });
```

### Setup runner

To set up a runner, create `SecRunner` instance passing a previously created configuration as follows:

```ts
import { Configuration } from '@sectester/core';
import { SecRunner } from '@sectester/runner';

const configuration = new Configuration({
  hostname: 'app.brightsec.com',
  projectId: 'your project ID'
});
const runner = new SecRunner(configuration);

// or

const runner2 = new SecRunner({
  hostname: 'app.brightsec.com',
  projectId: 'your project ID'
});
```

After that, you have to initialize a `SecRunner` instance:

```ts
await runner.init();
```

The runner is now ready to perform your tests, but you have to create a scan.

To dispose a runner, you just need to call the `clear` method:

```ts
await runner.clear();
```

### Starting scan

To start scanning your application, first you have to create a `SecScan` instance, as shown below:

```ts
const scan = runner.createScan({ tests: ['xss'] });
```

Below you will find a list of parameters that can be used to configure a `Scan`:

| Option                 | Description                                                                                                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests`                | The list of tests to be performed against the target application. To retrieve the complete list, send a request to the [API](https://app.brightsec.com/api/v1/scans/tests). [Learn more about tests](https://docs.brightsec.com/docs/vulnerability-guide). |
| `smart`                | Minimize scan time by using automatic smart decisions regarding parameter skipping, detection phases, etc. Enabled by default.                                                                                                                             |
| `skipStaticParams`     | Use an advanced algorithm to automatically determine if a parameter has any effect on the target system's behavior when changed, and skip testing such static parameters. Enabled by default.                                                              |
| `poolSize`             | Sets the maximum concurrent requests for the scan, to control the load on your server. By default, `10`.                                                                                                                                                   |
| `attackParamLocations` | Defines which part of the request to attack. By default, `body`, `query`, and `fragment`.                                                                                                                                                                  |
| `name`                 | The scan name. The method and hostname by default, e.g. `GET example.com`.                                                                                                                                                                                 |

#### Endpoint scan

To scan an existing endpoint in your application, invoke the run method with a `TargetOptions` argument.
For `TargetOptions` details, please refer to this [link](https://github.com/NeuraLegion/sectester-js/tree/master/packages/scan#defining-a-target-for-attack).

Example:

```ts
await scan.run({
  method: 'POST',
  url: 'https://localhost:8000/api/orders',
  body: { subject: 'Test', body: "<script>alert('xss')</script>" }
});
```

#### Function scan

To focus on the security aspects of a particular function in your application, you can perform a function-specific scan.
This automatically creates an auxiliary target with a POST endpoint under the hood.

Example:

```ts
const inputSample = {
  from: '2022-11-30',
  to: '2024-06-21'
};
// assuming `calculateWeekdays` is your function under test
const fn = ({ from, to }) => calculateWeekdays(from, to);

const scan = runner.createScan({ tests: ['date_manipulation'] });
await scan.run({ inputSample, fn });
```

#### Scan execution details

The `run` method returns promise that is resolved if scan finishes without any vulnerability found, and is rejected otherwise (on founding issue that meets threshold, on timeout, on scanning error).

If any vulnerabilities are found, they will be pretty printed to stdout or stderr (depending on severity) by [reporter](https://github.com/NeuraLegion/sectester-js/tree/master/packages/reporter).

By default, each found issue will cause the scan to stop immediately. To control this behavior, you can:

1. Set a severity threshold using the `threshold` method:

```ts
scan.threshold(Severity.HIGH);
```

Now found issues with severity lower than `HIGH` will not cause the scan to stop.

2. Control whether the scan fails immediately when an issue meeting the threshold is found using the `setFailFast` method:

```ts
scan.setFailFast(false);
```

When `failFast` is set to `false`, the scan will continue running even if issues meeting the threshold are found, collecting all issues before completing. This is useful when you want to identify all vulnerabilities in a single scan run rather than stopping at the first one found.

Sometimes either due to scan configuration issues or target misbehave, the scan might take much more time than you expect.
In this case, you can provide a timeout (in milliseconds) for specifying maximum scan running time:

```ts
scan.timeout(30000);
```

In that case after 30 seconds, if the scan isn't finishing or finding any vulnerability, it will throw an error.
The default timeout value for `SecScan` is 10 minutes.

### Usage sample

```ts
import { SecRunner, SecScan } from '@sectester/runner';

describe('/api', () => {
  let runner!: SecRunner;
  let scan!: SecScan;

  beforeEach(async () => {
    runner = new SecRunner({
      hostname: 'app.brightsec.com',
      projectId: 'your project ID'
    });

    await runner.init();

    scan = runner
      .createScan({ tests: ['xss'] })
      .threshold(Severity.MEDIUM) // i. e. ignore LOW severity issues
      .timeout(300000); // i. e. fail if last longer than 5 minutes
  });

  afterEach(async () => {
    await runner.clear();
  });

  describe('/orders', () => {
    it('should not have persistent xss', async () => {
      await scan.run({
        method: 'POST',
        url: 'https://localhost:8000/api/orders',
        body: { subject: 'Test', body: "<script>alert('xss')</script>" }
      });
    });

    it('should not have reflective xss', async () => {
      await scan.run({
        url: 'https://localhost:8000/api/orders',
        query: {
          q: `<script>alert('xss')</script>`
        }
      });
    });
  });
});
```

## License

Copyright © 2025 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
