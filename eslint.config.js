import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['src/components/ui/{button,sidebar}.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['buttonVariants', 'useSidebar'] }],
    },
  },
  {
    files: ['src/components/page-kit.jsx', 'src/features/orders/OrdersPage.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['useResource', 'useAction', 'field', 'column', 'choices'] }],
    },
  },
])
