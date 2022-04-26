module.exports = {
  extends: ['../../.eslintrc.json'],
  ignorePatterns: ['!**/*'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      parserOptions: {
        project: ['packages/scan/tsconfig.*?.json']
      },
      rules: {}
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            packageDir: [__dirname, `${__dirname}/../..`],
            devDependencies: false,
            optionalDependencies: false,
            peerDependencies: true
          }
        ]
      }
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {}
    },
    {
      files: ['*.spec.ts'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          {
            packageDir: [__dirname, `${__dirname}/../..`],
            devDependencies: true,
            optionalDependencies: false,
            peerDependencies: true
          }
        ]
      }
    }
  ]
};
