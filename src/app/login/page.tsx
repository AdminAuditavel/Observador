//src/app/login/page.tsx

"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ensureProfile } from "@/lib/ensureProfile";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = useMemo(() => {
    const raw = sp.get("next");
    return raw && raw.startsWith("/") ? raw : "/me";
  }, [sp]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      
      /**
       * PASSO CRÍTICO:
       * garante que public.profiles exista para este usuário
       */
      await ensureProfile();

      router.replace(next);
    } catch (e: any) {
      console.error(e);
      setErr("Falha no login/cadastro. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Observer</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setMode("signin")}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: mode === "signin" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: mode === "signup" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
          }}
        >
          Criar conta
        </button>
      </div>

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
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <button
          disabled={loading}
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <p style={{ fontSize: 12, opacity: 0.8 }}>
          Após login, você retorna automaticamente para: <code>{next}</code>
        </p>
      </form>
    </main>
  );
}
