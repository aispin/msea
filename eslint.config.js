import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  ignores: ['docs/**', 'dist/**', '.superpowers/**'],
  rules: {
    'style/max-statements-per-line': 'off',
  },
})
