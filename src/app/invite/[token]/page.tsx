//src/app/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";

  const [status, setStatus] = useState<
    "checking" | "need_login" | "accepting" | "success" | "error"
  >("checking");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!token) {
        if (!mounted) return;
        setStatus("error");
        setMessage("Token de convite inválido.");
        return;
      }

      // 1) checar sessão
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        if (!mounted) return;
        setStatus("error");
        setMessage("Falha ao verificar sessão.");
        return;
      }

      const session = sessionData?.session;
      if (!session) {
        // manda pro login e volta para este link após autenticar
        if (!mounted) return;
        setStatus("need_login");
        const next = encodeURIComponent(`/invite/${token}`);
        router.replace(`/login?next=${next}`);
        return;
      }

      // 2) aceitar convite via RPC
      if (!mounted) return;
      setStatus("accepting");
      setMessage("Aceitando convite...");

      const { error } = await supabase.rpc("accept_invite", { p_token: token });

      if (error) {
        if (!mounted) return;
        setStatus("error");
        // mensagem amigável; detalhes ficam no console se precisar
        console.error("accept_invite error:", error);
        setMessage("Convite inválido, expirado ou já utilizado.");
        return;
      }

      // 3) sucesso: redireciona
      if (!mounted) return;
      setStatus("success");
      setMessage("Convite aceito. Redirecionando...");

      // Escolha simples de destino do MVP:
      router.replace("/me");
      // Alternativa futura: router.replace("/feed/SBSP");
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router, token]);

  return (
    <main style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Observer</h1>

      {status === "checking" && <p>Validando convite...</p>}
      {status === "accepting" && <p>{message}</p>}
      {status === "need_login" && <p>Redirecionando para login...</p>}
      {status === "success" && <p>{message}</p>}
      {status === "error" && (
        <>
          <p style={{ marginBottom: 12 }}>{message}</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            Ir para login
          </button>
        </>
      )}
    </main>
  );
}
