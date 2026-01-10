// src/pages/Login.tsx

import React, { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";

function getNextFromQuery(search: string) {
  const sp = new URLSearchParams(search);
  const raw = sp.get("next");
  // segurança básica: só aceita caminhos internos
  if (raw && raw.startsWith("/")) return raw;
  return "/";
}

export default function Login() {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // após login, volta para "next"
      nav(next, { replace: true });
    } catch (e: any) {
      console.error(e);
      setErr("Falha no login. Verifique email e senha e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-semibold text-white mb-6">Observer</h1>

      <div className="mb-6">
        <button
          type="button"
          onClick={() => nav("/")}
          className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
        >
          Voltar para Home
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <label className="flex flex-col gap-2 text-sm text-white">
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            className="p-3 rounded-lg border border-gray-600 bg-gray-800 text-white"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-white">
          <span>Senha</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            className="p-3 rounded-lg border border-gray-600 bg-gray-800 text-white"
          />
        </label>

        {err && <p className="text-red-500 text-sm">{err}</p>}

        <button
          disabled={submitting}
          type="submit"
          className="w-full p-3 rounded-lg bg-primary hover:bg-blue-600 active:bg-blue-700 transition-colors text-white"
        >
          {submitting ? "Aguarde..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => nav(`/signup?next=${encodeURIComponent(next)}`)}
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white mt-4"
        >
          Criar conta
        </button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => nav("/forgot-password")}
            className="text-sm text-blue-400 hover:underline"
          >
            Esqueceu sua senha?
          </button>
        </div>
      </form>
    </main>
  );
}
