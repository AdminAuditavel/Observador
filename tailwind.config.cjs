module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // usamos CSS custom properties (tokens) então mapeamos nomes semânticos
      colors: {
        primary: 'var(--color-primary)',
        'primary-600': 'var(--color-primary-600)',
        appbg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
      },
      fontFamily: {
        display: ['Inter', 'Noto Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        subtle: 'var(--shadow-subtle)',
      },
    },
  },
  plugins: [],
}
