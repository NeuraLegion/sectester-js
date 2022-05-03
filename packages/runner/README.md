# @secbox/runner

Run scanning for vulnerabilities just from your unit tests on CI phase.

## Setup

```bash
npm i -s @secbox/runner
```

## Usage

For access to API you need to obtain a NeuraLegion token (either personal or organization API key).
Find out how to obtain [personal](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens) and [organization](https://docs.brightsec.com/docs/manage-your-organization#manage-organization-apicli-authentication-tokens) API keys in the [NeuraLegion knowledgebase](https://docs.brightsec.com).

By default, it will be read from `BRIGHT_TOKEN` environment variable,
but you can also pass it as part of `ConfigurationOptions`. Please refer to `@secbox/core` package [documentation](https://github.com/NeuraLegion/secbox-sdk-js/tree/master/packages/core#credentials) for more details.

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
      // will not fail if the found issue severity is lower than the threshold
      .threshold(Severity.MEDIUM);
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
