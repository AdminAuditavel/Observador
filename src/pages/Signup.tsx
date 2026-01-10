//src/pages/Signup.tsx

import React, { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";

function getNextFromQuery(search: string) {
  const sp = new URLSearchParams(search);
  const raw = sp.get("next");
  if (raw && raw.startsWith("/")) return raw;
  return "/";
}

export default function Signup() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, loading } = useAuth();

  const next = useMemo(() => getNextFromQuery(loc.search), [loc.search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>("");

  // se já está logado, volta direto
  React.useEffect(() => {
    if (!loading && user) {
      nav(next, { replace: true });
    }
  }, [loading, user, next, nav]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      /**
       * Observação: dependendo da config do Supabase,
       * pode haver confirmação por email.
       * Se a sessão vier imediatamente, você já retorna pro "next".
       * Se não vier, você pode mostrar mensagem.
       */
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data.session;

      if (hasSession) {
        nav(next, { replace: true });
        return;
      }

      // fallback: permanece na tela com orientação (sem travar o usuário)
      setErr("Conta criada. Verifique seu email para confirmar e depois faça login.");
    } catch (e: any) {
      console.error(e);
      setErr("Falha ao criar conta. Verifique e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Observer</h1>

      <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 16 }}>
        Após cadastro, você retorna para: <code>{next}</code>
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Senha</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>

        {err && <p style={{ color: err.includes("Conta criada") ? "#d97706" : "crimson" }}>{err}</p>}

        <button
          disabled={submitting}
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          {submitting ? "Aguarde..." : "Criar conta"}
        </button>

        <button
          type="button"
          onClick={() => nav(`/login?next=${encodeURIComponent(next)}`)}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
            opacity: 0.9,
          }}
        >
          Já tenho conta (Entrar)
        </button>
      </form>
    </main>
  );
}
