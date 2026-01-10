//src/pages/Signup.tsx

import React, { FormEvent, useEffect, useMemo, useState } from "react";
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

  const [role, setRole] = useState<string>("user"); // Default role for regular users

  // Invite handling
  const sp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialInvite = useMemo(() => (sp.get("invite") ?? "").trim(), [sp]);

  const [inviteCode, setInviteCode] = useState<string>(initialInvite);
  const [inviteStatus, setInviteStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >(initialInvite ? "validating" : "idle");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  // Se o usuário já estiver logado, redireciona
  useEffect(() => {
    if (!loading && user) {
      nav(next, { replace: true });
    }
  }, [loading, user, next, nav]);

  useEffect(() => {
    if (initialInvite) {
      validateInvite(initialInvite);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInvite]);

  async function validateInvite(token: string) {
    if (!token.trim()) {
      setInviteStatus("idle");
      setInviteMessage(null);
      return;
    }

    setInviteStatus("validating");
    setInviteMessage(null);
    try {
      // Ajuste a URL do endpoint conforme seu backend
      const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        setInviteStatus("invalid");
        setInviteMessage(txt || "Convite inválido ou expirado.");
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.valid) {
        setInviteStatus("valid");
        setInviteMessage(data?.message || "Convite válido — será aplicado no cadastro.");
        // força role collaborator visualmente (backend continua sendo autoridade)
        setRole("collaborator");
      } else {
        setInviteStatus("invalid");
        setInviteMessage(data?.message || "Convite inválido ou expirado.");
      }
    } catch (error) {
      console.error("validateInvite error", error);
      setInviteStatus("invalid");
      setInviteMessage("Erro ao validar o convite.");
    }
  }

  // Lógica para registrar um colaborador / usuário
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    try {
      // Determine role to set on profile:
      // If invite validated client-side, prefer collaborator (backend must enforce)
      const roleToSet = inviteStatus === "valid" ? "collaborator" : role === "collaborator" ? "collaborator" : "user";

      // Supabase sign up
      const { data: signData, error: signError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signError) throw signError;

      // Determine user id (prefer signUp response; fallback to supabase.auth.user())
      const userId = (signData && (signData as any).user && (signData as any).user.id) || supabase.auth.user()?.id;

      if (!userId) {
        // In some supabase setups, signUp may require email confirmation and user isn't immediately available.
        // We'll try to fetch current user; if still not available, proceed but notify backend to set profile later.
        console.warn("User ID not immediately available after signUp; attempting fallback.");
      }

      // Upsert profile. Backend/RLS should prevent elevation without valid invite.
      const profilePayload: any = {
        id: userId ?? undefined,
        email,
        role: roleToSet,
      };

      // If we have an invite token, include it so backend can validate/consume it server-side if you implement server endpoints.
      if (inviteCode.trim()) {
        profilePayload.invite = inviteCode.trim();
      }

      const { data, error: profileError } = await supabase.from("profiles").upsert([profilePayload]);

      if (profileError) {
        // If profile upsert fails because userId is undefined, still continue; user will complete profile after confirm.
        // But surface error to developer / user.
        throw profileError;
      }

      // Optional: If you want to consume the invite immediately via your backend API, you can call it here.
      // Example (backend should verify and consume): POST /api/invites/consume { token, userId }
      // We won't assume its existence; implement as needed.

      // Redireciona para a página next (mesmo que confirme email seja necessário)
      nav(next, { replace: true });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Falha ao criar conta. Verifique e tente novamente.");
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

        {/* Campo de convite */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Código / link de convite (opcional)</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setInviteStatus("idle");
                setInviteMessage(null);
              }}
              onBlur={() => {
                if (inviteCode.trim()) validateInvite(inviteCode.trim());
              }}
              placeholder="cole o token ou link de convite"
              aria-label="Código de convite"
              style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <button
              type="button"
              onClick={() => validateInvite(inviteCode.trim())}
              disabled={!inviteCode.trim() || inviteStatus === "validating"}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                cursor: inviteCode.trim() ? "pointer" : "not-allowed",
                opacity: inviteCode.trim() ? 1 : 0.6,
                background: inviteStatus === "valid" ? "#10b981" : undefined,
                color: inviteStatus === "valid" ? "white" : undefined,
              }}
            >
              {inviteStatus === "validating" ? "Validando..." : "Validar"}
            </button>
          </div>

          {inviteStatus === "valid" && <div style={{ color: "#10b981", fontSize: 13 }}>{inviteMessage}</div>}
          {inviteStatus === "invalid" && <div style={{ color: "#f59e0b", fontSize: 13 }}>{inviteMessage}</div>}
        </label>

        {/* Escolha de papel; se convite válido, forçamos visualmente collaborator */}
        <label style={{ display: "grid", gap: 6 }}>
          <span>Escolha seu papel</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={inviteStatus === "valid"}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value="user">Usuário (Apenas visualização)</option>
            <option value="collaborator">Colaborador (Criar post)</option>
          </select>
          {inviteStatus === "valid" && <small style={{ color: "#94a3b8" }}>Convite válido: cadastro como colaborador será aplicado.</small>}
        </label>

        {err && <p style={{ color: "crimson" }}>{err}</p>}

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
