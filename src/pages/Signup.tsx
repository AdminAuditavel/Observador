// src/pages/Signup.tsx

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";

/**
 * Signup page with optional invite handling.
 * - Prefills invite from ?invite=TOKEN when present
 * - Validates invite via RPC 'validate_invite' if available, otherwise reads invites table
 * - On successful signup tries to consume invite via RPC 'consume_invite_for_user'
 */

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
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>("");

  // invite handling
  const sp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialInvite = useMemo(() => (sp.get("invite") ?? "").trim(), [sp]);

  const [inviteCode, setInviteCode] = useState<string>(initialInvite);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "validating" | "valid" | "invalid">(initialInvite ? "validating" : "idle");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  // redirect if already logged
  useEffect(() => {
    if (!loading && user) {
      nav(next, { replace: true });
    }
  }, [loading, user, next, nav]);

  useEffect(() => {
    if (initialInvite) validateInvite(initialInvite);
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
      // Try RPC first (if you created a server-side function validate_invite)
      try {
        const rpcRes = await supabase.rpc("validate_invite", { p_token: token }).maybeSingle();
        if (rpcRes && (rpcRes as any).ok !== undefined) {
          const rpcData: any = rpcRes;
          if (rpcData.ok) {
            setInviteStatus("valid");
            setInviteMessage(rpcData.message || "Convite válido — será aplicado no cadastro.");
            return;
          } else {
            setInviteStatus("invalid");
            setInviteMessage(rpcData.message || "Convite inválido ou expirado.");
            return;
          }
        }
      } catch (rpcErr) {
        // Ignore rpc error and fallback to table select
        console.debug("validate_invite rpc not available or failed, falling back to table select", rpcErr);
      }

      // Fallback: read invites table (client-side). Prefer server-side validation in production.
      const { data, error } = await supabase
        .from("invites")
        .select("token, expires_at, used, uses, uses_limit, single_use, issued_to_email")
        .eq("token", token)
        .maybeSingle();

      if (error) {
        console.error("validateInvite supabase error", error);
        setInviteStatus("invalid");
        setInviteMessage("Erro ao validar convite.");
        return;
      }

      if (!data) {
        setInviteStatus("invalid");
        setInviteMessage("Convite não encontrado.");
        return;
      }

      if (data.used) {
        setInviteStatus("invalid");
        setInviteMessage("Convite já utilizado.");
        return;
      }

      if (data.expires_at) {
        const expires = new Date(data.expires_at).getTime();
        if (Number.isFinite(expires) && Date.now() > expires) {
          setInviteStatus("invalid");
          setInviteMessage("Convite expirado.");
          return;
        }
      }

      if (typeof data.uses_limit === "number" && typeof data.uses === "number") {
        if (data.uses_limit > 0 && data.uses >= data.uses_limit) {
          setInviteStatus("invalid");
          setInviteMessage("Convite atingiu o número máximo de usos.");
          return;
        }
      }

      setInviteStatus("valid");
      setInviteMessage(
        data.issued_to_email
          ? `Convite válido (destinado a ${data.issued_to_email}).`
          : "Convite válido — será aplicado no cadastro."
      );
    } catch (error) {
      console.error("validateInvite error", error);
      setInviteStatus("invalid");
      setInviteMessage("Erro ao validar o convite.");
    }
  }

  async function consumeInviteRpc(token: string, userId: string) {
    if (!token || !userId) return { ok: false, message: "token ou userId ausente" };

    try {
      // Call server-side RPC that consumes invite and sets role securely
      const res = await supabase.rpc("consume_invite_for_user", { p_token: token, p_user: userId }).single();
      // If your RPC returns jsonb with ok flag:
      const payload: any = res;
      if (payload?.ok === false) return { ok: false, message: payload?.message || "RPC returned not ok" };
      return { ok: true, data: payload };
    } catch (rpcErr) {
      console.warn("consumeInvite RPC failed", rpcErr);
      return { ok: false, message: "Erro no consumo do convite (RPC)." };
    }
  }

  // On submit: signUp -> if invite validated, try to consume via RPC -> upsert profile if needed.
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    try {
      // sign up
      const { data: signData, error: signError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signError) throw signError;

      // Try to obtain user id
      let userId: string | null = null;
      if (signData && (signData as any).user && (signData as any).user.id) {
        userId = (signData as any).user.id;
      } else {
        // try getUser fallback (may require session cookie)
        try {
          const current = await supabase.auth.getUser();
          userId = current?.data?.user?.id ?? null;
        } catch (uErr) {
          console.warn("getUser fallback error", uErr);
        }
      }

      // If invite valid and we have userId, try RPC consume (secure path)
      if (inviteStatus === "valid" && inviteCode.trim() && userId) {
        const consumed = await consumeInviteRpc(inviteCode.trim(), userId);
        if (!consumed.ok) {
          // Not fatal: inform user in console and continue. Ideally display a message.
          console.warn("invite consumption warning:", consumed.message);
        }
      }

      // Upsert profile (if userId available). If consume RPC already set collaborator role server-side
      // you can still upsert to ensure display_name/email present.
      if (userId) {
        const roleToSet = inviteStatus === "valid" ? "collaborator" : "user";
        const profilePayload: any = {
          id: userId,
          email,
          display_name: displayName || null,
          role: roleToSet,
        };

        const { error: profileError } = await supabase.from("profiles").upsert([profilePayload]);
        if (profileError) {
          console.warn("profile upsert error", profileError);
        }
      } else {
        // userId not available immediately (email confirmation flows). Inform user to confirm email.
        console.info("User ID not immediately available: user may need to confirm email. Profile will be created after confirm.");
      }

      // navigate back to next (signup may require email confirmation; still redirect)
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
          <span>Nome (opcional)</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como quer ser chamado?"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
        </label>

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

        {/* Invite (optional) */}
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
