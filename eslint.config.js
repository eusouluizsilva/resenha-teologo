import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'convex/_generated', 'node_modules', '.convex', 'vite.config.ts'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Permite `any` explícito em pontos isolados (eventos de webhook, etc).
      '@typescript-eslint/no-explicit-any': 'warn',
      // Variáveis prefixadas com _ são intencionalmente não usadas.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Regras novas do react-hooks v7 (set-state-in-effect, compiler hints)
      // detectam padrões legados que exigem refatoração maior. Mantemos como
      // warning para guiar refactors sem bloquear o build.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
)
