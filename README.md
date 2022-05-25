# SecTester SDK for JavaScript

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

## Table of contents

- [About the SecTester SDK](#about-the-sectester-sdk)
- [About Bright & SecTester](#about-bright--sectester)
- [Usage](#usage)
  - [Installation](#installation)
  - [Getting a Bright API key](#getting-a-bright-api-key)
  - [Usage examples](#usage-examples)
- [Documentation & Help](#documentation--help)
- [Contributing](#contributing)
- [License](#license)

## About the SecTester SDK

The SDK is designed to provide all the basic tools and functions that will allow you to create the interactions between the Bright scanning engine, run scans on any target and get the results, all in your own console or CI environment.

You can use the SDK command directly, or create a convenient wrapper for your project to integrate security testing directly into your web or testing framework of choice (you can see some examples in the Documentation section)

- This is a toolkit to work with the Bright scan engine
- It will allow you to build automations within your CI or local machine for security testing
- It is the direct interface with the Bright engine, which can be used to build framework/project specific wrappers

## About Bright & SecTester

Bright is a developer-first Dynamic Application Security Testing (DAST) scanner.

SecTester is a new tool that integrates our enterprise-grade scan engine directly into your unit tests.

With SecTester you can:

- Test every function and component directly
- Run security scans at the speed of unit tests
- Find vulnerabilities with no false positives, before you finalize your Pull Request

Trying out Bright’s SecTester is free 💸, so let’s get started!

> ⚠️ The SecTester project is currently in beta as an early-access tool. We are looking for your feedback to make it the best possible solution for developers, aimed to be used as part of your team’s SDLC. We apologize if not everything will work smoothly from the start, and hope a few bugs or missing features will be no match for you!
>
> Thank you! We appreciate your help and feedback!

## Usage

### Installation

First install the module via `yarn` or `npm` and do not forget to install the peer dependencies as well:

```bash
$ npm i -s @sec-tester/runner \
  @sec-tester/bus             \
  @sec-tester/core            \
  @sec-tester/repeater        \
  @sec-tester/reporter        \
  @sec-tester/scan
```

or

```bash
$ yarn add @sec-tester/runner  \
  @sec-tester/bus              \
  @sec-tester/core             \
  @sec-tester/repeater         \
  @sec-tester/reporter         \
  @sec-tester/scan
```

### Getting a Bright API key

1.  Register for a free account at Bright [**signup**](https://app.neuralegion.com/signup)
2.  Create a Bright API key (personal key from your [**UI**](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens)
3.  Save the Bright API key in your project
    1.  We recommend using your Github repository secrets feature to store the key, accessible via the `Settings > Security > Secrets > Actions` configuration. We use the ENV variable called `BRIGHT_TOKEN` in our examples
    2.  More info on [how to use ENV vars in Github actions](https://docs.github.com/en/actions/learn-github-actions/environment-variables)

### Usage examples

Here is an example to check your own application for XSS vulnerabilities:

```ts
import { SecRunner, SecScan } from '@sec-tester/runner';
import { Severity, TestType } from '@sec-tester/scan';

describe('/api', () => {
  let runner!: SecRunner;
  let scan!: SecScan;

  beforeEach(async () => {
    runner = new SecRunner({ hostname: 'app.neuralegion.com' });

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

Full documentation can be found in [**runner**](https://github.com/NeuraLegion/sec-tester-js/tree/master/packages/runner)

## Documentation & Help

- Full documentation available at: https://docs.brightsec.com/
- Join our [Discord](https://discord.gg/jy9BB7twtG) channel and ask anything!

## Contributing

Please read [contributing guidelines here](./CONTRIBUTING.md).

<a href="https://github.com/NeuraLegion/sec-tester-js/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=NeuraLegion/sec-tester-js"/>
</a>

## License

Copyright © 2022 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
