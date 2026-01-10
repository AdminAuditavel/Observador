//src/pages/Login.tsx

import { useLocation, useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Observer</h1>

      <p style={{ opacity: 0.85 }}>
        Você foi redirecionado para <code>{loc.pathname}</code>, mas o fluxo de login do SPA ainda
        não está conectado.
      </p>

      <button
        type="button"
        onClick={() => nav(-1)}
        style={{
          marginTop: 16,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ddd",
          cursor: "pointer",
        }}
      >
        Voltar
      </button>
    </main>
  );
}
