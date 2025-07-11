module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
  },
  extends: 'airbnb-base',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-len': 'off',
    camelcase: 'off',
    //  "no-unused-vars": "off",
    'no-console': 'off',
    'no-undef': 'error',
    'padded-blocks': 'off',
    'no-multiple-empty-lines': 1,
    'no-await-in-loop': 'off',
    'keyword-spacing': 1,
    'no-continue': 'off',
    'no-useless-escape': 1,
    'prefer-const': 1,
    'import/first': 1,
    'prefer-rest-params': 'off',
    'react/no-unused-state': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-unused-expressions': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    //  "eqeqeq": "off",
    'import/no-named-as-default': 'off',
    'react/destructuring-assignment': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-restricted-globals': 'off',
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'react/no-array-index-key': 'off',
    'no-return-assign': 'off',
    'react/forbid-prop-types': 'off',
    'react/no-unused-prop-types': 'off',
    quotes: 1,
    'no-trailing-spaces': 1,
    'no-multi-spaces': 1,
    indent: 1,
    'quote-props': 1,
    'spaced-comment': 1,
    'no-unused-vars': 1,
    'arrow-body-style': 1,
    'space-before-function-paren': 1,
    'arrow-parens': 1,
    'prefer-destructuring': 1,
    'object-curly-spacing': 1,

  },
};
