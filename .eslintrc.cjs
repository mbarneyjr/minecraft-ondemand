module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    mocha: true,
  },
  extends: [
    'airbnb-base',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json',
    EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
  },
  rules: {
    'max-len': ['error', 512],
    'yoda': 'off',
    'consistent-return': 'off',
    'prefer-destructuring': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'indent': ['error', 2],
    'quotes': ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true,
    }],
    'quote-props': ['error', 'consistent-as-needed'],
    'arrow-body-style': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-cycle': 'off',
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
      packageDir: [
        `${__dirname}`,
        `${__dirname}/frontend`,
      ],
    }],
    'import/no-relative-packages': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.mjs', '.ts', '.d.ts', '.mts', '.d.mts'],
        moduleDirectory: [
          'node_modules',
          'frontend',
        ],
      },
    },
  },
  ignorePatterns: [
    'coverage',
  ],
  overrides: [{
    files: [
      'frontend/*.*js',
    ],
    rules: {
      'no-alert': 'off',
      'no-restricted-globals': 'off',
      'implicit-arrow-linebreak': 'off',
    },
  }],
};
