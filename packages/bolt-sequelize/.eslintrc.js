const jsDocPlugin = require('eslint-plugin-jsdoc');

const jsDocRecommendedRulesOff = Object.assign(
  ...Object.keys(jsDocPlugin.configs.recommended.rules).map((rule) => ({ [rule]: 'off' })),
);

module.exports = {
  // This is a root of the project, ESLint should not look through parent directories to find more config
  root: true,
  ignorePatterns: [
    // Ignore all build outputs and artifacts (node_modules, dotfiles, and dot directories are implicitly ignored)
    '/dist',
    '/coverage',
  ],
  // These environments contain lists of global variables which are allowed to be accessed
  env: {
    // According to https://node.green, the target node version (v10) supports all important ES2018 features. But es2018
    // is not an option since it presumably doesn't introduce any new globals over ES2017.
    es2017: true,
    node: true,
  },
  extends: [
    // ESLint's recommended built-in rules: https://eslint.org/docs/rules/
    'eslint:recommended',
    // Node plugin's recommended rules: https://github.com/mysticatea/eslint-plugin-node
    'plugin:node/recommended',
    // AirBnB style guide (without React) rules: https://github.com/airbnb/javascript.
    'airbnb-base',
    // JSDoc plugin's recommended rules
    'plugin:jsdoc/recommended',
  ],
  rules: {
    // Eliminate tabs to standardize on spaces for indentation. If you want to use tabs for something other than
    // indentation, you may need to turn this rule off using an inline config comments.
    'no-tabs': 'error',
    // Bans use of comma as an operator because it can obscure side effects and is often an accident.
    'no-sequences': 'error',
    // Disallow the use of process.exit()
    'node/no-process-exit': 'error',
    // Allow safe references to functions before the declaration. Overrides AirBnB config. Not located in the override
    // section below because a distinct override is necessary in TypeScript files.
    'no-use-before-define': ['error', 'nofunc'],
    // Formatter rules
    "consistent-return": 2,
    "indent"           : [1, 4],
    "no-else-return"   : 1,
    "semi"             : [1, "always"],
    "space-unary-ops"  : 2,
  },

  overrides: [
    {
      files: ['**/*.ts'],
      // Allow ESLint to understand TypeScript syntax
      parser: '@typescript-eslint/parser',
      parserOptions: {
        // The following option makes it possible to use rules that require type information
        project: './tsconfig.eslint.json',
      },
      // Allow ESLint to load rules from the TypeScript plugin
      plugins: ['@typescript-eslint'],
      extends: [
        // TypeScript plugin's recommended rules
        'plugin:@typescript-eslint/recommended',
        // AirBnB style guide (without React), modified for TypeScript rules: https://github.com/iamturns/eslint-config-airbnb-typescript.
        'airbnb-typescript/base',
      ],

      rules: {
        'max-classes-per-file': 'off',
        'node/no-extraneous-import': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-commonjs': ['error', {
          allowConditionalRequire: false,
        }],
        'import/named': 'off',
        'node/no-missing-import': 'off',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/explicit-member-accessibility': 'error',
        '@typescript-eslint/consistent-type-assertions': ['error', {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow-as-parameter',
        }],
        '@typescript-eslint/explicit-module-boundary-types': ['error', {
          allowArgumentsExplicitlyTypedAsAny: true,
        }],
        ...jsDocRecommendedRulesOff,
        'jsdoc/no-types': 'error',
        'node/no-unsupported-features/es-syntax': 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
        '@typescript-eslint/no-inferrable-types': 'off',
        'operator-linebreak': ['error', 'after', { overrides: {
          '=': 'none'
        }}],

        'node/no-unpublished-import': 'off',
      },
    },
    {
      files: ['**/*.js', '**/*.ts'],
      rules: {
        // Increase the max line length to 120. The rest of this setting is copied from the AirBnB config.
        'max-len': ['error', 120, 2, {
          ignoreUrls: true,
          ignoreComments: false,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        }],
        quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
        camelcase: 'off',
        'no-underscore-dangle': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_'
          }
        ],
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'default',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'variable',
            // PascalCase for variables is added to allow exporting a singleton, function library, or bare object as in
            // section 23.8 of the AirBnB style guide
            format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'parameter',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'typeLike',
            format: ['PascalCase', 'camelCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'typeProperty',
            format: ['snake_case', 'camelCase'],
          },
          {
            'selector': 'objectLiteralProperty',
            format: ['camelCase', 'snake_case', 'PascalCase'],
          },
          {
            selector: ['enumMember'],
            format: ['PascalCase'],
          },
        ],
        // Allow cyclical imports. Turning this rule on is mainly a way to manage the performance concern for linting
        // time. Our projects are not large enough to warrant this. Overrides AirBnB styles.
        'import/no-cycle': 'off',
        // Prevent importing submodules of other modules. Using the internal structure of a module exposes
        // implementation details that can potentially change in breaking ways. Overrides AirBnB styles.
        'import/no-internal-modules': ['error', {
          // Use the following option to set a list of allowable globs in this project.
          allow: [
            '**/middleware/*', // the src/middleware directory doesn't export a module, it's just a namespace.
            '**/receivers/*', // the src/receivers directory doesn't export a module, it's just a namespace.
            '**/types/**/*',
            '**/types/*', // type heirarchies should be used however one wants
          ],
        }],
        // Remove the minProperties option for enforcing line breaks between braces. The AirBnB config sets this to 4,
        // which is arbitrary and not backed by anything specific in the style guide. If we just remove it, we can
        // rely on the max-len rule to determine if the line is too long and then enforce line breaks. Overrides AirBnB
        // styles.
        'object-curly-newline': ['error', { multiline: true, consistent: true }],

      },
    },
    {
      files: ['src/**/*.spec.ts'],
      rules: {
        // With Mocha as a test framework, it is sometimes helpful to assign
        // shared state to Mocha's Context object, for example in setup and
        // teardown test methods. Assigning stub/mock objects to the Context
        // object via `this` is a common pattern in Mocha. As such, using
        // `function` over the the arrow notation binds `this` appropriately and
        // should be used in tests. So: we turn off the prefer-arrow-callback
        // rule.
        // See https://github.com/slackapi/bolt-js/pull/1012#pullrequestreview-711232738
        // for a case of arrow-vs-function syntax coming up for the team
        'prefer-arrow-callback': 'off',
        // Unlike non-test-code, where we require use of `as Type` instead of `<Type>` for type assertion,
        // in test code using the looser `as Type` syntax leads to easier test writing, since only required
        // properties must be adhered to using the `as Type` syntax.
        '@typescript-eslint/consistent-type-assertions': ['error', {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        }],
        // Using any types is so useful for mock objects, we are fine with disabling this rule
        '@typescript-eslint/no-explicit-any': 'off',
        // Some parts in Bolt (e.g., listener arguments) are unnecessarily optional.
        // It's okay to omit this validation in tests.
        '@typescript-eslint/no-non-null-assertion': 'off',
        // Using ununamed functions (e.g., null logger) in tests is fine
        'func-names': 'off',
        // In tests, don't force constructing a Symbol with a descriptor, as
        // it's probably just for tests
        'symbol-description': 'off',
      },
    },
  ],
};
