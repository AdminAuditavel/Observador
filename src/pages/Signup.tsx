// src/pages/Signup.tsx

import React, {useEffect, FormEvent, useState, useMemo } from "react";
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
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>("");

  // Invite handling
  const sp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const initialInvite = useMemo(() => (sp.get("invite") ?? "").trim(), [sp]);

  const [inviteCode, setInviteCode] = useState<string>(initialInvite);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "validating" | "valid" | "invalid">(
    initialInvite ? "validating" : "idle"
  );
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  // redirect if already logged
  React.useEffect(() => {
    if (!loading && user) {
      nav(next, { replace: true });
    }
  }, [loading, user, next, nav]);

  useEffect(() => {
    if (initialInvite) validateInvite(initialInvite);
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
    <main className="max-w-lg mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">Cadastro</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
            Nome (opcional)
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como quer ser chamado?"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="inviteCode">
            Código de convite (opcional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onBlur={() => validateInvite(inviteCode.trim())}
              placeholder="Insira o código do convite"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => validateInvite(inviteCode.trim())}
              disabled={!inviteCode.trim() || inviteStatus === "validating"}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Validar
            </button>
          </div>
          {inviteStatus === "valid" && <p className="text-green-500 text-sm">{inviteMessage}</p>}
          {inviteStatus === "invalid" && <p className="text-red-500 text-sm">{inviteMessage}</p>}
        </div>

        {err && <p className="text-red-500 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {submitting ? "Criando..." : "Criar Conta"}
        </button>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => nav("/")}
            className="text-sm text-blue-600 hover:underline"
          >
            Voltar para Home
          </button>

          <button
            type="button"
            onClick={() => nav(`/login?next=${encodeURIComponent(next)}`)}
            className="text-sm text-blue-600 hover:underline"
          >
            Já tenho conta
          </button>
        </div>
      </form>
    </main>
  );
}
