# @secbox/runner

Top level @secbox module for usage in test frameworks.

## Setup

```bash
npm i -s @secbox/runner
```

## Usage

```ts
import { DefaultSecRunner, SecRunner, SecScan } from './lib';
import { Severity, TestType } from './models';

describe('/api', () => {
  let runner!: SecRunner;
  let scan!: SecScan;

  beforeEach(async () => {
    runner = new DefaultSecRunner({ cluster: 'app.neuralegion.com' });
    scan = runner
      .createScan({ tests: [TestType.XSS] })
      // will not fail if the found issue severity is lower than the threshold
      .threshold(Severity.MEDIUM);

    await runner.init({
      timeout: 20000,
      maxContentLength: 50
    });
  });

  afterEach(async () => {
    await runner.clear();
  });

  describe('xss', () => {
    it('POST /orders should not have xss', async () => {
      const target = runner.createTarget({
        method: 'POST',
        url: 'https://localhost:8000/api/orders',
        body: { subject: 'Test', body: "<a href='/'>Link</a>" }
      });

      await scan.run(target);
    });

    it('should not have xss', async () => {
      const target = runner.createTarget({
        method: 'GET',
        url: 'https://localhost:8000/api/orders',
        query: {
          q: `<script>alert('xss')</script>`
        }
      });

      await scan.run(target);
    });
  });
});
```

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
