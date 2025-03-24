# @sectester/reporter

[![Maintainability](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/maintainability)](https://codeclimate.com/github/NeuraLegion/sectester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a5f72ececc9b0f402802/test_coverage)](https://codeclimate.com/github/NeuraLegion/sectester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sectester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sectester/core)

Provide an abstraction for generating test results as part of the particular test frameworks.

## Setup

```bash
npm i -s @sectester/reporter
```

## Usage

The package provides an implementation of the `Reporter` that lets to get results to stdout, i.e. `StdReporter`:

```ts
import { Reporter, StdReporter } from '@sectester/reporter';

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

In addition, the package exposes a `PlainTextFormatter` that implements a `Formatter` interface:

```ts
import { Formatter, PlainTextFormatter } from '@sectester/reporter';

const formatter: Formatter = new PlainTextFormatter();
```

To convert an issue into text, you just need to call the `format` method:

```ts
formatter.format(issue);
```

<details>
<summary>Sample output</summary>

```
Issue in Bright UI:   https://app.brightsec.com/scans/djoqtSDRJYaR6sH8pfYpDX/issues/8iacauN1FH9vFvDCLoo42v
Name:                 Missing Strict-Transport-Security Header
Severity:             Low
Remediation:
Make sure to proprely set and configure headers on your application - missing strict-transport-security header
Details:
The engine detected a missing strict-transport-security header. Headers are used to outline communication and
improve security of application.
Extra Details:
● Missing Strict-Transport-Security Header
    The engine detected a missing Strict-Transport-Security header, which might cause data to be sent insecurely from the client to the server.
    Remedy:
     - Make sure to set this header to one of the following options:
        1. Strict-Transport-Security: max-age=<expire-time>
        2. Strict-Transport-Security: max-age=<expire-time>; includeSubDomains
        3. Strict-Transport-Security: max-age=<expire-time>; preload
    Resources:
     - https://www.owasp.org/index.php/OWASP_Secure_Headers_Project#hsts
    Issues found on the following URLs:
     - [GET] https://qa.brokencrystals.com/
```

</details>

## License

Copyright © 2024 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
