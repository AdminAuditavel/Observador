import React from 'react';
import ThemeToggle from './ThemeToggle/ThemeToggle'; // já existia antes
import Button from './Button';

export default function Header() {
  return (
    <header className="app-header container" role="banner">
      <div className="brand" aria-label="Aeródromo Pro">
        <span className="logo" aria-hidden />
        <span>Aeródromo Pro</span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="note muted" style={{ fontSize: 13 }}>Conexão: <strong style={{ color: 'var(--primary)' }}>OK</strong></div>
        <ThemeToggle />
        <Button variant="ghost" onClick={() => { /* abrir perfil ou configurações */ }}>Perfil</Button>
      </div>
    </header>
  );
}
