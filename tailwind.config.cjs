module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/styles/**/*.{css}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // mapeamento para suas CSS custom properties (tokens)
      colors: {
        primary: 'var(--primary)',
        'primary-600': 'var(--primary)', // ajuste se quiser um tom escuro separado
        appbg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        success: 'var(--success)',
        danger: 'var(--critical)',
      },
      fontFamily: {
        display: ['Inter', 'Noto Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
      },
      boxShadow: {
        soft: 'var(--shadow-md)',
        subtle: 'var(--shadow-subtle)',
      },
    },
  },
  plugins: [],
};
