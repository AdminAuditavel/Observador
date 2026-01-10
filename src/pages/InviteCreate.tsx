// src/pages/InviteCreate.tsx
import React, { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";

function generateToken(length = 32) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return token;
}

export default function InviteCreate() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [token, setToken] = useState<string>(generateToken(24));
  const [roleToGrant, setRoleToGrant] = useState<string>("user");
  const [expiresAt, setExpiresAt] = useState<string>(""); // datetime-local value
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<null | {
    id?: string;
    token: string;
    created_at?: string;
    expires_at?: string | null;
    max_uses?: number | null;
  }>(null);

  const roleOptions = useMemo(() => ["user", "editor", "admin"], []);

  function handleGenerate() {
    setToken(generateToken(24));
  }

  function localDatetimeToISO(value: string | ""): string | null {
    if (!value) return null;
    // value is in "yyyy-mm-ddThh:mm" format (no timezone). Convert to ISO.
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    setSuccessData(null);

    try {
      const payload: any = {
        token: token.trim() || generateToken(24),
        role_to_grant: roleToGrant || "user",
        created_by: user?.id ?? null,
        uses: 0,
      };

      // max_uses: if empty or <= 0 => null (meaning unlimited), else store number
      if (maxUses === "" || Number(maxUses) <= 0) {
        payload.max_uses = null;
      } else {
        payload.max_uses = Number(maxUses);
      }

      // expires_at: convert to ISO or null
      const isoExpires = localDatetimeToISO(expiresAt);
      payload.expires_at = isoExpires;

      // insert into invites; return inserted row
      const { data, error } = await supabase
        .from("invites")
        .insert([payload])
        .select()
        .maybeSingle();

      if (error) {
        console.error("insert invite error", error);
        throw error;
      }

      // Show success with token and other info
      setSuccessData({
        id: (data as any)?.id,
        token: (data as any)?.token ?? payload.token,
        created_at: (data as any)?.created_at ?? undefined,
        expires_at: (data as any)?.expires_at ?? null,
        max_uses: (data as any)?.max_uses ?? payload.max_uses,
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Falha ao criar convite. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyToken() {
    if (!successData?.token) return;
    try {
      await navigator.clipboard.writeText(successData.token);
    } catch (e) {
      console.error("copy failed", e);
    }
  }

  return (
    <main className="max-w-lg mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">Criar Convite</h1>

      {successData ? (
        <section className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              Convite criado com sucesso.
            </p>

            <div className="mt-3">
              <p className="text-xs text-gray-600">Token:</p>
              <div className="flex items-center space-x-2 mt-1">
                <code className="px-3 py-2 bg-gray-100 rounded text-sm break-all">{successData.token}</code>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Copiar
                </button>
              </div>
            </div>

            {successData.expires_at && (
              <p className="text-sm mt-2 text-gray-700">
                Expira em: <strong>{new Date(successData.expires_at).toLocaleString()}</strong>
              </p>
            )}

            <p className="text-sm mt-2 text-gray-700">
              Máximo de usos:{" "}
              <strong>{successData.max_uses === null || successData.max_uses === undefined ? "Ilimitado" : successData.max_uses}</strong>
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                // reset form to create another
                setSuccessData(null);
                setToken(generateToken(24));
                setExpiresAt("");
                setMaxUses("");
                setRoleToGrant("user");
              }}
              className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Criar outro
            </button>

            <button
              type="button"
              onClick={() => nav("/invites")}
              className="py-2 px-4 bg-gray-200 text-black rounded hover:bg-gray-300"
            >
              Ver convites
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="token">
              Token (opcional)
            </label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                placeholder="Deixe em branco para gerar automaticamente"
              />
              <button
                type="button"
                onClick={handleGenerate}
                className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
              >
                Gerar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Deixe em branco para gerar um token aleatório.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="role">
              Papel a conceder
            </label>
            <select
              id="role"
              value={roleToGrant}
              onChange={(e) => setRoleToGrant(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="custom">Outro (digite abaixo)</option>
            </select>

            {roleToGrant === "custom" && (
              <input
                type="text"
                className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                placeholder="Digite o nome do papel"
                onChange={(e) => setRoleToGrant(e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="expires_at">
                Expira em (opcional)
              </label>
              <input
                id="expires_at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Deixe em branco para sem expiração.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="max_uses">
                Máximo de usos (0 = ilimitado)
              </label>
              <input
                id="max_uses"
                type="number"
                min={0}
                value={String(maxUses)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setMaxUses("");
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  setMaxUses(n);
                }}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
            </div>
          </div>

          {err && <p className="text-red-500 text-sm">{err}</p>}

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={submitting}
              className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? "Criando..." : "Criar Convite"}
            </button>

            <button
              type="button"
              onClick={() => nav("/")}
              className="py-2 px-4 bg-gray-200 text-black rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
