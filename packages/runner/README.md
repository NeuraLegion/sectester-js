# @sec-tester/runner

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

Run scanning for vulnerabilities just from your unit tests on CI phase.

## Setup

```bash
npm i -s @sec-tester/runner
```

## Step-by-step guide

### Configure SDK

To start writing tests, first obtain a NeuraLegion token (either personal or organization API key), which is required for the access to NeuraLegion API.
Find out how to obtain [personal](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens)
and [organization](https://docs.brightsec.com/docs/manage-your-organization#manage-organization-apicli-authentication-tokens) API keys in the [NeuraLegion knowledgebase](https://docs.brightsec.com).

Then put obtained token into `BRIGHT_TOKEN` environment variable to make it accessible by default [`EnvCredentialProvider`](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/core#envcredentialprovider).

> Refer to `@sec-tester/core` package [documentation](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/core#credentials) for the details on alternative ways of configuring credential providers.

Once it is done, create a configuration object. Single required option is NeuraLegion `cluster` domain you are going to use, e.g. `app.neuralegion.com` as the main one:

```ts
import { Configuration } from '@sec-tester/core';

const configuration = new Configuration({ cluster: 'app.neuralegion.com' });
```

### Setup runner

To set up a runner, create `SecRunner` instance passing a previously created configuration as follows:

```ts
import { Configuration } from '@sec-tester/core';
import { SecRunner } from '@sec-tester/runner';

const configuration = new Configuration({ cluster: 'app.neuralegion.com' });
const runner = new SecRunner(configuration);

// or

const runner2 = new SecRunner({ cluster: 'app.neuralegion.com' });
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
const scan = runner.createScan({ tests: [TestType.XSS] });
```

Below you will find a list of parameters that can be used to configure a `Scan`:

| Option                 | Description                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests`                | The list of tests to be performed against the target application. [Learn more about tests](https://docs.brightsec.com/docs/vulnerability-guide)                                               |
| `smart`                | Minimize scan time by using automatic smart decisions regarding parameter skipping, detection phases, etc. Enabled by default.                                                                |
| `skipStaticParams`     | Use an advanced algorithm to automatically determine if a parameter has any effect on the target system's behavior when changed, and skip testing such static parameters. Enabled by default. |
| `poolSize`             | Sets the maximum concurrent requests for the scan, to control the load on your server. By default, `10`.                                                                                      |
| `attackParamLocations` | Defines which part of the request to attack. By default, `body`, `query`, and `fragment`.                                                                                                     |
| `slowEpTimeout`        | Skip entry-points that take longer to respond than specified ms value. By default, 1000ms.                                                                                                    |
| `targetTimeout`        | Measure timeout responses from the target application globally, and stop the scan if the target is unresponsive for longer than the specified time. By default, 5s.                           |
| `name`                 | The scan name. The method and hostname by default, e.g. `GET example.com`.                                                                                                                    |

Finally, run a scan against your application:

```ts
await scan.run({
  method: 'POST',
  url: 'https://localhost:8000/api/orders',
  body: { subject: 'Test', body: "<script>alert('xss')</script>" }
});
```

The `run` method takes a single argument (for details, see [here](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/scan#defining-a-target-for-attack)), and returns promise that is resolved if scan finishes without any vulnerability found, and is rejected otherwise (on founding issue that meets threshold, on timeout, on scanning error).

If any vulnerabilities are found, they will be pretty printed to stdout or stderr (depending on severity) by [reporter](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/reporter).

By default, each found issue will cause the scan to stop. To control this behavior you can set a severity threshold using the `threshold` method:

```ts
scan.threshold(Severity.HIGH);
```

Now found issues with severity lower than `HIGH` will not cause the scan to stop.

Sometimes either due to scan configuration issues or target misbehave, the scan might take much more time than you expect.
In this case, you can provide a timeout (in milliseconds) for specifying maximum scan running time:

```ts
scan.timeout(30000);
```

In that case after 30 seconds, if the scan isn't finishing or finding any vulnerability, it will throw an error.

### Usage sample

```ts
import { SecRunner, SecScan } from '@sec-tester/runner';
import { Severity, TestType } from '@sec-tester/scan';

describe('/api', () => {
  let runner!: SecRunner;
  let scan!: SecScan;

  beforeEach(async () => {
    runner = new SecRunner({ cluster: 'app.neuralegion.com' });

    await runner.init();

    scan = runner
      .createScan({ tests: [TestType.XSS] })
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

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
