# @secbox/runner

Run scanning for vulnerabilities just from your unit tests on CI phase.

## Setup

```bash
npm i -s @secbox/runner
```

## Usage

1.  Setup credentials:

    - Obtain a NeuraLegion token (either personal or organization API key), which is required for the access to NeuraLegion API. Find out how to obtain [personal](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens) and [organization](https://docs.brightsec.com/docs/manage-your-organization#manage-organization-apicli-authentication-tokens) API keys in the [NeuraLegion knowledgebase](https://docs.brightsec.com).

    - Put obtained token into `BRIGHT_TOKEN` environment variable to make it accesible by default [`EnvCredentialProvider`](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/core#envcredentialprovider). Or refer to `@secbox/core` package [documentation](https://github.com/NeuraLegion/secbox-sdk-js/tree/master/packages/core#credentials) for the details on alternative ways of configuring credential providers.

2.  Setup `SecRunner`:

    - Create `SecRunner` instance, providing either `ConfigurationOptions` or `Confiruration` instance as constructor argument.
      Single required option is NeuraLegion `cluster` domain you are going to use, e.g. `app.neuralegion.com` as the main one.
      See other available advanced config options [here](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/core#options).

    - Initialize `SecRunner` instance by calling `init()`.

3.  Setup `SecScan`:

        * Create `SecScan` instance by calling `createScan(opts: SecScanOptions)` of `SecRunner` instance providing at least list of `tests`

          <details>
          <summary>Advanced scan options</summary>

          | Name                   | Mandatory | Default                     | Description                                                                                                                           |
          | ---------------------- |-----------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
          | `tests`                | Yes       | N/A                         | The list of tests to be performed against the target application. [See full list](https://docs.brightsec.com/docs/vulnerability-guide)|
          | `smart`                | No        | true                        | Enabled by default to minimize scan time by using automatic smart decisions regarding parameter skipping, detection phases, etc.      |
          | `skipStaticParams`     | No        | true                        | Detects if a parameter has any effect on the target behavior when changed, and skip testing static parameters.                        |
          | `poolSize`             | No        | 10                          | Sets the maximum concurrent requests for the scan, to control the load on your server.                                                |
          | `attackParamLocations` | No        | ['body', 'query', 'fragment'] | Defines which part of the request to attack. Additionally available values are 'header' and 'path'                                  |
          | `slowEpTimeout`        | No        | 1000                        | Skip entry-points that take longer to respond than specified ms value                                                                 |
          | `name`                 | No        | *endpoint name*             | The scan name. Default one will look like `GET https://example.com/`.                                                                 |

          </details>

        * *Optional.* Set a severity threshold via `threshold(severity: Severity)` method of `SecScan` instance.

    If it is set, found issues with severity lower than specified will not cause scan to stop.

        * *Optional.* Set scan timeout in milliseconds via `timeout(value: number)` method of `SecScan` instance.

    If it is set, scanning will be aborted by after specified timeout.

4.  Run scan:
    - call `run(target: TargetOptions)` method of `SecScan` instance. Scanning is performed via [repeater](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/repeater), that is created automatically behind the scene.
    - Returned promise is resolved if scan finishes w/o any vulnerability found, and is rejected otherwise (on founding issue that meets threshold, on timeout, on scanning error)
    - If any vulnerabilities are found - they will be pretty printed to stdout or stderr (depending on severity) by [reporter](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/reporter).

### Usage sample

```ts
import { SecRunner, SecScan, Severity, TestType } from '@secbox/runner';

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
