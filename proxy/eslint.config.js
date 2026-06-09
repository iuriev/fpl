import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': ['error', {
        groups: [
          ['^node:'],
          ['^[^./]'],
          ['^@/'],
          ['^\\.'],
        ],
      }],
      'simple-import-sort/exports': 'error',
      'no-restricted-syntax': ['error', {
        selector: 'CallExpression[callee.object.name="vi"][callee.property.name="mock"] ~ ImportDeclaration',
        message: 'Import declarations must come before vi.mock() calls.',
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
    },
  },
  prettierConfig,
);
