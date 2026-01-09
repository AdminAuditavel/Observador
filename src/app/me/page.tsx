//src/app/me/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ensureProfile } from "@/lib/ensureProfile";

type Profile = {
  id: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  avatar_url: string | null;

  contact_email: string | null;
  contact_phone: string | null;
  organization: string | null;
  notes: string | null;
};

export default function MePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [notes, setNotes] = useState("");

  const roleLabel = useMemo(() => {
    const r = profile?.role;
    if (!r) return "";
    if (r === "admin") return "Admin";
    if (r === "collaborator") return "Colaborador";
    return "Usuário";
  }, [profile?.role]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErrorMsg("");

      // 1) sessão
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        if (!mounted) return;
        setErrorMsg("Falha ao verificar sessão.");
        setLoading(false);
        return;
      }

      if (!sessionData.session) {
        if (!mounted) return;
        router.replace(`/login?next=${encodeURIComponent("/me")}`);
        return;
      }

      // 2) garantir profile (cria linha se necessário)
      try {
        await ensureProfile();
      } catch (e) {
        console.error(e);
        // não bloqueia; mas tende a resolver ao recarregar
      }

      // 3) carregar profile
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (!mounted) return;
        router.replace(`/login?next=${encodeURIComponent("/me")}`);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, role, is_active, avatar_url, contact_email, contact_phone, organization, notes"
        )
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setErrorMsg("Não foi possível carregar seu perfil.");
        setLoading(false);
        return;
      }

      const p = data as Profile;
      setProfile(p);

      // popular campos do form
      setDisplayName(p.display_name ?? "");
      setContactEmail(p.contact_email ?? "");
      setContactPhone(p.contact_phone ?? "");
      setOrganization(p.organization ?? "");
      setNotes(p.notes ?? "");

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSave() {
    if (!profile) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        display_name: displayName.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        organization: organization.trim() || null,
        notes: notes.trim() || null,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", profile.id);
      if (error) throw error;

      // atualizar estado local
      setProfile({ ...profile, ...payload } as Profile);
    } catch (e) {
      console.error(e);
      setErrorMsg("Falha ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Observer</h1>
        <p>Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 680, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Meu perfil</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>
            {roleLabel ? <>Tipo de acesso: <strong>{roleLabel}</strong></> : null}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </header>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Dados</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nome exibido</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex.: Moisés"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Email de contato (opcional)</span>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Ex.: contato@empresa.com"
              inputMode="email"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Telefone/WhatsApp (opcional)</span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Ex.: +55 93 9xxxx-xxxx"
              inputMode="tel"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Organização (opcional)</span>
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Ex.: NAV Brasil / Operador / Aeroclube"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Função, observações, etc."
              rows={4}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", resize: "vertical" }}
            />
          </label>

          {errorMsg && <p style={{ color: "crimson", margin: 0 }}>{errorMsg}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !profile}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              onClick={() => router.replace("/")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                cursor: "pointer",
                opacity: 0.85,
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Próximos passos</h2>
        <p style={{ margin: 0, opacity: 0.85 }}>
          Agora que login/convite/perfil estão prontos, o próximo componente do MVP é o{" "}
          <strong>feed por aeródromo</strong> e a <strong>tela de postagem</strong>.
        </p>
      </section>
    </main>
  );
}
