# @secbox/reporter

Provide an abstraction for generating test results as part of the particular test frameworks.

## Setup

```bash
npm i -s @secbox/reporter
```

## Usage

```ts
import { Reporter, StdReporter } from '@secboox/reporter';

const reporter: Reporter = new StdReporter();
await reporter.report(scan);
```

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
