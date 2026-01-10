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
  const [showPassword, setShowPassword] = useState(false);
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

        <label className="flex flex-col gap-2 text-sm text-white relative">
          <span>Senha</span>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:underline px-2 py-1"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showPassword ? "Esconder" : "Mostrar"}
            </button>
          </div>
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

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => nav("/forgot-password")}
            className="text-blue-400 hover:underline"
          >
            Esqueceu sua senha?
          </button>

          <button
            type="button"
            onClick={() => nav("/")}
            className="text-blue-400 hover:underline"
          >
            Voltar para Home
          </button>
        </div>
      </form>
    </main>
  );
}
