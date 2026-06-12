import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'build/**',
      'dist/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.js',
      '__mocks__/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      'no-undef': 'off',
      'no-restricted-globals': 'off',
      'no-unused-vars': 'off',
    },
  },
];