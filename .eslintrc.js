
module.exports = {
  "parser": "@typescript-eslint/parser",
  "extends": [
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    // "@transcend-io/transcend",
  ],
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "plugins": [
    "import",
    "@typescript-eslint",
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
  },
  "rules": {
    "@typescript-eslint/prefer-interface": 0,
    "@typescript-eslint/indent": 0,
    '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
    "@typescript-eslint/camelcase": 0,
    "@typescript-eslint/interface-name-prefix": 0,
    "@typescript-eslint/no-var-requires": 0,
    "template-curly-spacing": 0,
    "arrow-parens": ["error", "always"],
    "arrow-body-style": [2, "as-needed"],
    "class-methods-use-this": ["error"],
    "comma-dangle": [2, "always-multiline"],
    "function-paren-newline": 0,
    "import/imports-first": ["error"],
    "import/newline-after-import": ["error"],
    "import/no-dynamic-require": ["error"],
    "import/no-extraneous-dependencies": 0,
    "import/no-named-as-default": 0,
    // "import/no-relative-parent-imports": ["warn"],
    "import/no-unresolved": 2,
    "import/no-webpack-loader-syntax": ["error"],
    "import/prefer-default-export": 0,
    "indent": 0,
    // "jsdoc/check-types":  ["error"],
    "max-len": ["error", 125, { "comments": 200 }],
    "max-lines": ["error", 350],
    // "newline-per-chained-call": ["error", { "ignoreChainWithDepth": 2 }],
    "no-confusing-arrow": 0,
    "no-console": 1,
    "no-multi-spaces": ["error"],
    "no-use-before-define": ["error"],
    // "object-curly-newline": ["error", { "multiline": true, "minProperties": 4, "consistent": true }],
    "object-property-newline": "error",
    "prefer-template": 2,
    "require-jsdoc": ["error", {
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true,
        "ArrowFunctionExpression": false,
        "FunctionExpression": true
      }
    }],
    "require-yield": ["error"],
    "sort-vars": ["error", { "ignoreCase": true }],
  },
  "settings": {
    "import/resolver": {
      "typescript": {},
    }
  }
}
