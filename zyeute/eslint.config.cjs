module.exports = [
  {
    ignores: ['node_modules', '.expo', 'dist', 'build']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      quotes: ['warn', 'single'],
      semi: ['warn', 'never']
    }
  }
]
