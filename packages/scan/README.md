# @secbox/scan

The package defines a simple public API to manage scans, create, and send the reporters after the scan has been finished.

## Setup

```bash
npm i -s @secbox/scan
```

## Usage

### ScanFactory

To use the `ScanFactory`, pass the following options object to the constructor method:

```ts
const config = new Configuration({
  cluster: 'app.neuralegion.com'
});

const scans = new HttpScans(new HttpCommandDispatcher(/*options*/));

const scanFactory = new ScanFactory(scans, config);
```

> To see more about `HttpCommandDispatcher` please see `@secbox/bus`

### Scan

To create `Scan` you should use `createScan` method from `ScanFactory`.

```ts
const scanFactory = new ScanFactory(/*options*/);

const scanSettings: ScanSettings =

const scan = scanFactory.createScan({
  name: 'example',
  target: { url: 'https://example.com' },
  tests: [TestType.DOM_XSS]
})
```

Below you will find a list of parameters that can be used to configure a `Scan`:

| Option                 | Description                                 |
| ---------------------- | ------------------------------------------- |
| `name`                 | Application url                             |
| `tests`                | Authorization token                         |
| `target`               | The target that will be attacked            |
| `smart`                | Determine whether scan is smart or simple   |
| `poolSize`             | Pool size                                   |
| `repeatersId`          | Id of the repeater                          |
| `skipStaticParams`     | Allows to skip testing static parameters.   |
| `attackParamLocations` | Defines which part of the request to attack |

To get list of issues please use `listIssues` from `Scan`.

```ts
const scan = scanFactory.createScan(/*options*/);

const issues = await scan.listIssues();
```

To wait for certain conditions you can use `waitFor` method.

```ts
await scan.waitFor({ expectation: IssueCategory.HIGH });
const issues = await scan.listIssues();
```

To ensure that the scan is done and nothing prevents the user to check for issues, you can use a `status` method to obtain scan status:

```ts
for await (const state of scan.status()) {
  // your code
}
```

> When pooling is timed out or tests failed scan will be stoped.

This `await..of loop` will be work while scan is active.

To stop scan please use `stop` method.

```ts
await scan.stop();
```

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
