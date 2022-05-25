# @sec-tester/scan

[![Maintainability](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/maintainability)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/68d2f22b6a9e1e38ed21/test_coverage)](https://codeclimate.com/github/NeuraLegion/sec-tester-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/sec-tester-js/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)
![NPM Downloads](https://img.shields.io/npm/dw/@sec-tester/core)

The package defines a simple public API to manage scans and their expectations.

## Setup

```bash
npm i -s @sec-tester/scan
```

## Usage

To start scanning your application, you have to create a `ScanFactory` as follows:

```ts
import { Configuration } from '@sec-tester/core';
import { ScanFactory } from '@sec-tester/scan';

const config = new Configuration({
  hostname: 'app.neuralegion.com'
});

const scanFactory = new ScanFactory(config);
```

To create a new scan, you have to define a target first (for details, see [here](#defining-a-target-for-attack)):

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com'
});
```

The factory exposes the `createScan` method that returns a new [Scan instance](#managing-a-scan):

```ts
import { TestType } from '@sec-tester/scan';

const scan = await scanFactory.createScan({
  target,
  tests: [TestType.HEADER_SECURITY]
});
```

Below you will find a list of parameters that can be used to configure a `Scan`:

| Option                 | Description                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`               | The target that will be attacked. For details, see [here](#defining-a-target-for-attack).                                                                                                          |
| `tests`                | The list of tests to be performed against the target application. [Learn more about tests](https://docs.brightsec.com/docs/vulnerability-guide)                                                    |
| `repeaterId`           | Connects the scan to a Repeater agent, which provides secure access to local networks.                                                                                                             |
| `smart`                | Minimize scan time by using automatic smart decisions regarding parameter skipping, detection phases, etc. Enabled by default.                                                                     |
| `skipStaticParams`     | Use an advanced algorithm to automatically determine if a parameter has any effect on the target system's behavior when changed, and skip testing such static parameters. Enabled by default.      |
| `poolSize`             | Sets the maximum concurrent requests for the scan, to control the load on your server. By default, `10`.                                                                                           |
| `attackParamLocations` | Defines which part of the request to attack. By default, `body`, `query`, and `fragment`.                                                                                                          |
| `slowEpTimeout`        | Automatically validate entry-point response time before initiating the vulnerability testing, and reduce scan time by skipping any entry-points that take too long to respond. By default, 1000ms. |
| `targetTimeout`        | Measure timeout responses from the target application globally, and stop the scan if the target is unresponsive for longer than the specified time. By default, 5s.                                |
| `name`                 | The scan name. The method and hostname by default, e.g. `GET example.com`.                                                                                                                         |

### Defining a target for attack

The target can accept the following options:

#### url

- type: `string`

The server URL that will be used for the request. Usually the `url` represents a WHATWG URL:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com'
});
```

If `url` contains a query string, they will be parsed as search params:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com?foo=bar'
});

console.log(target.queryString); // foo=bar
```

If you pass a `query` parameter, it will override these which obtained from `url`:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com?foo=bar',
  query: '?bar=foo'
});

console.log(target.queryString); // bar=foo
```

#### method

- type: `string | HttpMethod`

The request method to be used when making the request, `GET` by default:

```ts
import { Target, HttpMethod } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com',
  method: HttpMethod.DELETE
});
```

#### query

- type: `string | URLSearchParams | Record<string, string | string[]>`

The query parameters to be sent with the request:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com',
  query: {
    hello: 'world',
    foo: '123'
  }
});

console.log(target.queryString); // hello=world&foo=123
```

If you need to pass an array, you can do it using a `URLSearchParams` instance:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com',
  query: new URLSearchParams([
    ['key', 'a'],
    ['key', 'b']
  ])
});

console.log(target.queryString); // key=a&key=b
```

> This will override the query string in url.

It is possible to define a custom serializer for query parameters:

```ts
import { Target } from '@sec-tester/scan';
import { stringify } from 'qs';

const target = new Target({
  url: 'https://example.com',
  query: { a: ['b', 'c', 'd'] },
  serializeQuery(params: Record<string, string | string[]>): string {
    return stringify(params);
  }
});

console.log(target.queryString); // a[0]=b&a[1]=c&a[2]=d
```

#### headers

- type: `Record<string, string | string[]>`

The HTTP headers to be sent:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com',
  headers: {
    'content-type': 'application/json'
  }
});
```

#### body

- type: `unknown`

The data to be sent as the request body. Makes sense only for `POST`, `PUT`, `PATCH`, and `DELETE`:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com',
  body: {
    foo: 'bar'
  }
});
```

You can use `FormData` objects, such as [form-data](https://www.npmjs.com/package/form-data), as request body as well:

```ts
import { Target } from '@sec-tester/scan';
import FormData from 'form-data';

const form = new FormData();
form.set('greeting', 'Hello, world!');

const target = new Target({
  url: 'https://example.com',
  body: form
});
```

It is possible to set a form as body using an instance of `URLSearchParams`:

```ts
import { Target } from '@sec-tester/scan';

const target = new Target({
  url: 'https://example.com',
  body: new URLSearchParams('foo=bar')
});
```

### Managing a scan

The `Scan` provides a lightweight API to revise and control the status of test execution.

For instance, to get a list of found issues, you can use the `issues` method:

```ts
const issues = await scan.issues();
```

To wait for certain conditions you can use the `expect` method:

```ts
await scan.expect(Severity.HIGH);
const issues = await scan.issues();
```

> It returns control as soon as a scan is done, timeout is gone, or an expectation is satisfied.

You can also define a custom expectation passing a function that accepts an instance of `Scan` as follows:

```ts
await scan.expect((scan: Scan) => scan.done);
```

It might return a `Promise` instance as well:

```ts
await scan.expect(async (scan: Scan) => {
  const issues = await scan.issues();

  return issues.length > 3;
});
```

You can use the `status` method to obtain scan status, to ensure that the scan is done and nothing prevents the user to check for issues, or for other reasons:

```ts
for await (const state of scan.status()) {
  // your code
}
```

> This `for...of` will work while a scan is active.

To stop scan, use the `stop` method:

```ts
await scan.stop();
```

To dispose a scan, you just need to call the `dispose` method:

```ts
await scan.dispose();
```

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
