# @secbox/runner

Top level @secbox module for usage in test frameworks.

## Setup

```bash
npm i -s @secbox/runner
```

## Usage

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
