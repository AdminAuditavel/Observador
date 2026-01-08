module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#135bec',
        background: '#F7FAFC',
        surface: '#FFFFFF',
        'surface-muted': '#F3F6F9',
        'surface-border': '#E6EEF7',
        text: '#0F1724',
        muted: '#6B7280',
        critical: '#ef4444',
        'purple-accent': '#7C3AED'
      },
      fontFamily: {
        display: ['Inter', 'Noto Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
