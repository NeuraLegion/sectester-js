# SecBox SDK for JavaScript

[![Maintainability](https://api.codeclimate.com/v1/badges/ca77b676cf791e045aee/maintainability)](https://codeclimate.com/github/NeuraLegion/secbox-sdk-js/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ca77b676cf791e045aee/test_coverage)](https://codeclimate.com/github/NeuraLegion/secbox-sdk-js/test_coverage)
![Build Status](https://github.com/NeuraLegion/secbox-sdk-js/actions/workflows/auto-build.yml/badge.svg?branch=master)
![NPM Downloads](https://img.shields.io/npm/dw/@secbox/core)

## Installation

To install all dependencies used by this project, issue this command in your terminal:

```bash
$ npm ci
```

### Build

The project can be built manually by issuing the following command:

```bash
npm run build -- ${lib}
```

The build artifacts will be stored in the `dist` folder.

### Tests

#### Running unit tests

Run this command in terminal to execute the unit tests via [Jest](https://jestjs.io/):

```bash
$ npm t
```

#### Running end-to-end tests

Run his command in terminal to execute the end-to-end tests:

```bash
$ npm run e2e
```

Set `NODE_ENV` variable to `test` if you want to use test mock and stubs, to reduce overhead.

### Linting

This project uses [ESLint](https://eslint.org) for code linting.

> ⚡ ESLint can be configured via `.eslintrc.json` file in the project root folder.

To lint all the apps and modules by running:

```bash
$ npm run nx run-many --all --target lint
```

To lint single module, run this command in terminal:

```bash
$ npm run lint -- ${lib}
```

To lint multiple modules at once:

```bash
$ npm run nx run-many -- --target=lint --projects=${lib},${lib1}
```

### Formatting

This project uses [Prettier](https://prettier.io/) for code formatting.

> ⚡ ESLint can be configured via `.prettierrc` file in the project root folder.

To format all the apps and modules by running:

```bash
$ npm run nx run-many --all --target format
```

To format single module, run this command in terminal:

```bash
$ npm run format -- ${lib}
```

To format multiple modules at once:

```bash
$ npm run nx run-many -- --target=format --projects=${lib},${lib1}
```

## Contributing

To ensure consistency throughout the source code, keep these rules in mind as you are working:

- Inspect the format, syntax errors, deviations before pushing to the branch.
- Don't use transpilation mode of the compiler. You can use it only to debug.
- We love OOP and, whenever possible, prefer them over closures and functions.

> ⚡ We use [husky](https://github.com/typicode/husky), [commitlint](https://github.com/conventional-changelog/commitlint#readme) and [lint-staged](https://github.com/okonet/lint-staged), they will help you to follow these rules.

- [How to contribute to NeuraLegion](https://team-1602965683919.atlassian.net/wiki/spaces/TEST/pages/256180295/How+to+contribute+to+NeuraLegion)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Angular Git Commit Guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

## License

Copyright © 2022 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
