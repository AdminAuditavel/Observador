import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      title="Alternar tema"
      className="p-2 rounded-md hover:bg-[rgba(0,0,0,0.04)]"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
