/**
 * Common jsdoc formatting rules
 */
const JSDOC_RULES = {
  require: {
    ArrowFunctionExpression: false,
    ClassDeclaration: true,
    ClassExpression: true,
    FunctionDeclaration: true,
    FunctionExpression: true,
    MethodDefinition: true,
  },
  contexts: [
    {
      context: 'TSPropertySignature',
      inlineCommentBlock: true,
    },
    'TSEnumDeclaration',
    'TSTypeAliasDeclaration',
    'FunctionDeclaration',
    'ClassDeclaration',
  ],
};

module.exports = {
  globals: {
    // Allow for self to be a mirror of window
    self: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended',
    'plugin:eslint-comments/recommended',
  ],
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true,
    mocha: true,
  },
  plugins: ['import', '@typescript-eslint', 'jsdoc'],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // //////// //
    // Disabled //
    // //////// //

    /** Handled by prettier */
    'comma-dangle': 0,
    'operator-linebreak': 0,
    'implicit-arrow-linebreak': 0,
    '@typescript-eslint/indent': 0,
    'object-curly-newline': 0,
    'template-curly-spacing': 0,
    'newline-per-chained-call': 0,
    'generator-star-spacing': 0,
    'computed-property-spacing': 0,
    'space-before-function-paren': 0,
    indent: 0,
    'function-paren-newline': 0,
    'no-confusing-arrow': 0,
    'no-multi-spaces': 0,
    'object-property-newline': 0,
    'brace-style': 0,

    /** handled by no-restricted-syntax */
    'guard-for-in': 0,

    /**
     * We prefer to use types instead of interfaces
     *
     * @see https://www.notion.so/transcend/Use-Type-instead-of-Interface-b3868d0885724b6894647018323a57b2
     */
    '@typescript-eslint/prefer-interface': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    // when we do use interfaces, they are often empty
    '@typescript-eslint/no-empty-interface': 0,

    /** Use import lint rules */
    '@typescript-eslint/no-var-requires': 0,

    /**
     * Sometimes its just fun to nest ternary....
     *
     * With prettier its not so bad. its best to avoid
     * super deeply nest ternary statements but doing and if else if else is not bad
     */
    'no-nested-ternary': 0,

    /**
     * We use a custom pre-commit for import orders
     *
     * @see pre_commit_hooks/ordered_imports.js
     */
    'import/order': 0,

    /** no types are required cuz we use typescript */
    'jsdoc/require-param-type': 0,
    'jsdoc/require-returns-type': 0,

    /**
     * TS allows for public syntax in constructor to make a constructor
     * parameter assigned to the class instance. We use this often and so
     * the constructor is often empty
     */
    'no-useless-constructor': 0,

    /** Import rules we don't use */
    'import/no-named-as-default': 0,
    'import/extensions': 0,
    'import/prefer-default-export': 0,

    /** We use @typescript-eslint */
    'no-use-before-define': 0,
    'no-shadow': 0,
    camelcase: 0,
    'no-var-requires': 0,
    'no-inferrable-types': 0,

    // ///// //
    // Rules //
    // ///// //

    /** Enforce === instead of == */
    eqeqeq: ['error'],

    /**
     * Require class methods to call this. If you want a class
     * method to not use this, you can workaround the rule by using
     * arrow function syntax, i.e.
     *
     * `public myParam = () => []`
     */
    'class-methods-use-this': ['error'],

    /**
     * Type signatures should be combined if possible:
     *
     * @see https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unified-signatures.md
     */
    '@typescript-eslint/unified-signatures': ['error'],

    /**
     * Group overrides next to each other
     *
     * @see https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/adjacent-overload-signatures.md
     */
    '@typescript-eslint/adjacent-overload-signatures': ['error'],

    /**
     * Explicitly specify return types to functions. This improves type safety
     * and also allows compiler to optimize
     *
     * @see https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-function-return-type.md
     * @see https://www.notion.so/transcend/4ef10ad243b746d9b2a84f8bb4a1b01a?v=8eb2ce8c21d54b43a916e7f93a563950&p=36b3bd33e054443084d2759537e6423b
     */
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 0,

    /** JSdoc Validation */
    'jsdoc/require-jsdoc': ['error', JSDOC_RULES],
    'jsdoc/check-types': ['error'],
    'jsdoc/check-param-names': ['error', { checkDestructured: false }],
    'jsdoc/require-returns': ['error'],
    'jsdoc/no-types': ['error'],
    'jsdoc/require-param': ['error', { checkDestructured: false }],
    'jsdoc/require-param-description': ['error'],
    'jsdoc/require-returns-description': ['error'],
    'jsdoc/require-hyphen-before-param-description': ['error'],
    'jsdoc/require-description': [
      'error',
      {
        contexts: JSDOC_RULES.contexts.map(
          (context) => context.context || context,
        ),
      },
    ],

    /** Import validation */
    'import/imports-first': ['error'],
    'import/newline-after-import': ['error'],
    'import/no-dynamic-require': ['error'],
    'import/no-unresolved': ['error'],
    'import/no-webpack-loader-syntax': ['error'],

    /**
     * Console log statements are normally used in debugging.
     * Instead we should use event manager on backend, or create and
     * use a singleton logger instance in each class.
     *
     * As a workaround you can set `const logger = console` and run `logger.log()`
     */
    'no-console': ['error'],

    /** Use template strings for concatenation */
    'prefer-template': ['error'],

    /**
     * Limits on file size to make them digestible and
     *
     * Limit line length to make code accessible on smaller screens.
     */
    'max-len': ['error', 125, { comments: 150 }],

    /** Require curly brackets around newlines */
    curly: ['error'],

    /** Ensure eslint-disable is not present when its not disabling any rule */
    'eslint-comments/no-unused-disable': ['error'],

    /** Arrow functions should have parentheses around inputs */
    'arrow-parens': ['error', 'always'],
    'arrow-body-style': ['error', 'as-needed'],

    /** Max lines in a file */
    'max-lines': ['error', 350],

    /** Generator functions should call `yield` */
    'require-yield': ['error'],

    /** Prefer for-of to for loop (in general we prefer map/forEach over for of as well) */
    '@typescript-eslint/prefer-for-of': ['error'],

    /** Should not alias this to another command */
    '@typescript-eslint/no-this-alias': ['error'],

    /** Prevent use of global variables */
    'no-restricted-globals': ['error'],

    /** No unnecessary async statements on a function */
    'require-await': ['error'],

    // TODO: https://github.com/benmosher/eslint-plugin-import/pull/1696 - Remove overrides,
    // PR is merging soon -- 9/2/2020
    'import/no-extraneous-dependencies': 0,

    // No unused imports or variables. Convenient for pre-commit hook.
    '@typescript-eslint/no-unused-vars': ['error'],

    /** We want to eventually turn this to an error */
    '@typescript-eslint/ban-types': ['error'],
    '@typescript-eslint/no-explicit-any': ['error'],
  },
  settings: {
    /** Allow for typescript alias resolution */
    'import/resolver': {
      typescript: {},
    },
  },
};
