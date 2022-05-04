# @sec-tester/reporter

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

Provide an abstraction for generating test results as part of the particular test frameworks.

## Setup

```bash
npm i -s @sec-tester/reporter
```

## Usage

The package provides only one implementation of the `Reporter` that lets to get results to stdout, i.e. `StdReporter`:

```ts
import { Reporter, StdReporter } from '@sec-tester/reporter';

const reporter: Reporter = new StdReporter();
```

You just need to call the `report` method to send findings to stdout:

```ts
await reporter.report(scan);
```

<details>
<summary>Sample console output</summary>

![reporter-sample](reporter-sample.png)

</details>

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
