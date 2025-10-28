import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/**",
    "src/components/animate-ui/**"
  ]),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-duplicates': 'warn',
    },
  },
  {
    rules: {
      semi: 'off',
      singleQuote: 'off',
      trailingComma: 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off'
    }
  }
]);

export default eslintConfig;
