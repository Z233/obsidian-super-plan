const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: {
    '@typescript-eslint': {},
  },
  env: { node: true },
  parserOptions: {
    sourceType: 'module',
  },
})
