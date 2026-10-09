// @ts-check
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}

const [
  { default: tseslint },
  { default: eslintConfigPrettier },
  { default: prettierPlugin },
  { default: jest },
] = await Promise.all([
  import('typescript-eslint'),
  import('eslint-config-prettier'),
  import('eslint-plugin-prettier'),
  import('eslint-plugin-jest'),
]);

const sharedRules = {
  'prettier/prettier': 'error',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  complexity: ['error', 15],
  'max-len': ['error', 150],
  'max-depth': 'error',
  'max-lines': 'error',
  'max-lines-per-function': 'error',
  'max-nested-callbacks': 'error',
  'max-params': ['warn', 8],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-arrow-callback': 'error',
  'no-restricted-properties': [
    'error',
    { object: 'describe', property: 'only' },
    { object: 'it', property: 'only' },
  ],
  'no-warning-comments': [
    'error',
    { terms: ['todo', 'to-do'], location: 'anywhere' },
  ],
};

export default tseslint.config(
  {
    files: ['src/*/.ts'],
    extends: [
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // @ts-ignore
    rules: {
      ...sharedRules,
    },
  },
  {
    files: ['test/*/.ts'],
    extends: [
      ...tseslint.configs.recommended,
      jest.configs['flat/recommended'],
      eslintConfigPrettier,
    ],
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...sharedRules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/assertions-in-tests': 'off',
      'max-lines': ['error', { max: 700, skipBlankLines: true }],
      'max-lines-per-function': 'off',
      'jest/valid-title': ['error', { ignoreTypeOfDescribeName: true }],
      'jest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'request.**.expect'] },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['src/*', '/src/*'],
              message:
                'Use path aliases (@src/, @test/) instead of bare src/ imports.',
            },
          ],
        },
      ],
    },
  },
  { ignores: ['dist/*', 'node_modules/', 'coverage/*'] },
);
