import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tsParser from '@typescript-eslint/parser';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
        sourceType: 'module',
      },
    },
  },
];
