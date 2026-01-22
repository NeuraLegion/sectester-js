# SecTester SDK for JavaScript

[![Maintainability](https://qlty.sh/gh/NeuraLegion/projects/sectester-js/maintainability.svg)](https://qlty.sh/gh/NeuraLegion/projects/sectester-js)
[![Code Coverage](https://qlty.sh/gh/NeuraLegion/projects/sectester-js/coverage.svg)](https://qlty.sh/gh/NeuraLegion/projects/sectester-js)
![Build Status](https://github.com/NeuraLegion/sectester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sectester/core)

## Table of contents

- [About the SecTester SDK](#about-the-sectester-sdk)
- [About Bright & SecTester](#about-bright--sectester)
- [Usage](#usage)
  - [Installation](#installation)
  - [Getting a Bright API key](#getting-a-bright-api-key)
  - [Usage examples](#usage-examples)
- [Documentation & Help](#documentation--help)
- [Ecosystem](#ecosystem)
- [Contributing](#contributing)
- [License](#license)

## About the SecTester SDK

This SDK is designed to provide all the basic tools and functions that will allow you to easily integrate the Bright security testing engine into your own project.

With the SDK you can:

- Work with the Bright scan engine, without leaving your IDE
- Build automations within your CI or local machine for security testing
- Create your own framework/project specific wrappers (you can see some examples in the Documentation section)

## About Bright & SecTester

Bright is a developer-first Dynamic Application Security Testing (DAST) scanner.

SecTester is a new tool that integrates our enterprise-grade scan engine directly into your unit tests.

With SecTester you can:

- Test every function and component directly
- Run security scans at the speed of unit tests
- Find vulnerabilities with no false positives, before you finalize your Pull Request

Trying out Bright’s SecTester is _**free**_ 💸, so let’s get started!

> [!WARNING]  
> The SecTester project is currently in beta as an early-access tool. We are looking for your feedback to make it the best possible solution for developers, aimed to be used as part of your team’s SDLC. We apologize if not everything will work smoothly from the start, and hope a few bugs or missing features will be no match for you!
>
> Thank you! We appreciate your help and feedback!

## Usage

### Installation

First install the module via `yarn` or `npm` and do not forget to install the peer dependencies as well:

```bash
$ npm i -s @sectester/runner \
  @sectester/core            \
  @sectester/repeater        \
  @sectester/reporter        \
  @sectester/scan
```

or

```bash
$ yarn add @sectester/runner  \
  @sectester/core             \
  @sectester/repeater         \
  @sectester/reporter         \
  @sectester/scan
```

### Getting a Bright API key

1. Navigate to the [**User API key creation**](https://app.brightsec.com/profile) section on the profile page.
2. Create a Bright API key ([**check out our doc on how to create a user key**](https://docs.brightsec.com/docs/manage-your-personal-account#manage-your-personal-api-keys-authentication-tokens))
3. Save the Bright API key
   1. We recommend using your Github repository secrets feature to store the key, accessible via the `Settings > Security > Secrets > Actions` configuration. We use the ENV variable called `BRIGHT_TOKEN` in our examples
   2. If you don’t use that option, make sure you save the key in a secure location. You will need to access it later on in the project but will not be able to view it again.
   3. More info on [**how to use ENV vars in Github actions**](https://docs.github.com/en/actions/learn-github-actions/environment-variables)

> [!IMPORTANT]
> Create a Bright API key with the following scopes:
>
> - `auth-objects:read`
> - `bot`
> - `entry-points:read`
> - `entry-points:manage`
> - `issues:read`
> - `projects:read`
> - `repeaters:read`
> - `repeaters:write`
> - `scans:delete`
> - `scans:read`
> - `scans:run`
> - `scans:stop`

> [!TIP]
> Make sure your API key is saved in a location where you can retrieve it later! You will need it in these next steps!

### Usage examples

Full configuration & usage examples can be found in:

- [Nest.js Demo](https://github.com/NeuraLegion/sectester-js-demo).
- [Broken Crystals Demo](https://github.com/NeuraLegion/sectester-js-demo-broken-crystals).
- [ASP.NET Demo](https://github.com/NeuraLegion/sectester-net-demo).

## Documentation & Help

- Full documentation available at: https://docs.brightsec.com/
- A demo project can forked from: https://github.com/NeuraLegion/sectester-js-demo
- Join our [Discord channel](https://discord.gg/jy9BB7twtG) and ask anything!

## Ecosystem

- [SecTester JS SDK](https://github.com/NeuraLegion/sectester-js).
- [SecTester NET SDK](https://github.com/NeuraLegion/sectester-net).

## Contributing

Please read [contributing guidelines here](./CONTRIBUTING.md).

<a href="https://github.com/NeuraLegion/sectester-js/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=NeuraLegion/sectester-js"/>
</a>

## License

Copyright © 2025 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
