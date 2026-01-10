// src/pages/InviteList.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

type InviteRow = {
  id: string;
  token: string;
  role_to_grant: string | null;
  created_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses: number | null;
  revoked_at: string | null;
  created_by: string | null;
};

export default function InviteList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
    // optional: subscribe to realtime changes if desired
  }, []);

  async function fetchInvites() {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("id, token, role_to_grant, created_at, expires_at, max_uses, uses, revoked_at, created_by")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as any) || []);
    } catch (e: any) {
      console.error(e);
      setErr("Falha ao carregar convites.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    setActionLoading(id);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("invites").update({ revoked_at: now }).eq("id", id);
      if (error) throw error;
      await fetchInvites();
    } catch (e) {
      console.error(e);
      setErr("Não foi possível revogar o convite.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCopy(token?: string) {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch (e) {
      console.error("copy failed", e);
    }
  }

  return (
    <main className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Convites</h1>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/invites/new")}
            className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Criar Convite
          </button>
        </div>
      </div>

      {err && <p className="text-red-500 mb-4">{err}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum convite encontrado.</p>
      ) : (
        <div className="overflow-x-auto bg-surface p-4 rounded shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="pb-2">Token</th>
                <th className="pb-2">Papel</th>
                <th className="pb-2">Criado</th>
                <th className="pb-2">Expira</th>
                <th className="pb-2">Usos</th>
                <th className="pb-2">Máx</th>
                <th className="pb-2">Revogado</th>
                <th className="pb-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="py-2 align-top max-w-xs break-words">{it.token}</td>
                  <td className="py-2 align-top">{it.role_to_grant ?? "-"}</td>
                  <td className="py-2 align-top">{it.created_at ? new Date(it.created_at).toLocaleString() : "-"}</td>
                  <td className="py-2 align-top">{it.expires_at ? new Date(it.expires_at).toLocaleString() : "—"}</td>
                  <td className="py-2 align-top">{it.uses ?? 0}</td>
                  <td className="py-2 align-top">{it.max_uses === null ? "Ilimitado" : it.max_uses}</td>
                  <td className="py-2 align-top">{it.revoked_at ? new Date(it.revoked_at).toLocaleString() : "—"}</td>
                  <td className="py-2 align-top">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(it.token)}
                        className="px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        Copiar
                      </button>

                      <button
                        onClick={() => handleRevoke(it.id)}
                        disabled={!!it.revoked_at || actionLoading === it.id}
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm disabled:opacity-50"
                      >
                        {actionLoading === it.id ? "..." : it.revoked_at ? "Revogado" : "Revogar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
```
