//src/app/post/[icao]/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ensureProfile } from "@/lib/ensureProfile";

type Aerodrome = {
  id: string;
  icao: string;
  name: string | null;
};

type Profile = {
  id: string;
  role: string;
  is_active: boolean;
};

type ObservationType =
  | "meteo_visual"
  | "runway"
  | "apron_ground"
  | "infrastructure"
  | "general";

function typeLabel(t: ObservationType) {
  switch (t) {
    case "meteo_visual":
      return "Meteorologia visual";
    case "runway":
      return "Pista";
    case "apron_ground":
      return "Pátio / Solo";
    case "infrastructure":
      return "Infraestrutura";
    case "general":
      return "Geral";
  }
}

function safeFileName(name: string) {
  // remove caracteres estranhos para evitar path estranho
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

export default function PostByIcaoPage() {
  const router = useRouter();
  const params = useParams();

  const icao = useMemo(() => {
    const raw = params?.icao;
    const v = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    return (v || "").toUpperCase();
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  const [aerodrome, setAerodrome] = useState<Aerodrome | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [obsType, setObsType] = useState<ObservationType>("meteo_visual");
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "collaborators">("public");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const canPost = useMemo(() => {
    const r = profile?.role;
    return r === "admin" || r === "collaborator";
  }, [profile?.role]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
      setErr("");
      setAerodrome(null);
      setProfile(null);

      if (!icao || icao.length !== 4) {
        setErr("ICAO inválido.");
        setLoading(false);
        return;
      }

      // sessão
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        if (!mounted) return;
        setErr("Falha ao verificar sessão.");
        setLoading(false);
        return;
      }
      if (!sessionData.session) {
        if (!mounted) return;
        router.replace(`/login?next=${encodeURIComponent(`/post/${icao}`)}`);
        return;
      }

      // garantir profile
      try {
        await ensureProfile();
      } catch (e) {
        console.error(e);
      }

      // usuário + profile
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (!mounted) return;
        router.replace(`/login?next=${encodeURIComponent(`/post/${icao}`)}`);
        return;
      }

      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      if (pErr) {
        console.error(pErr);
        setErr("Não foi possível carregar seu perfil.");
        setLoading(false);
        return;
      }
      setProfile(pData as Profile);

      // aeródromo
      const { data: aData, error: aErr } = await supabase
        .from("aerodromes")
        .select("id, icao, name")
        .eq("icao", icao)
        .single();

      if (!mounted) return;

      if (aErr) {
        console.error(aErr);
        setErr("Aeródromo não encontrado (ou inativo).");
        setLoading(false);
        return;
      }

      setAerodrome(aData as Aerodrome);
      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [icao, router]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onSubmit() {
    setErr("");

    if (!aerodrome) {
      setErr("Aeródromo inválido.");
      return;
    }
    if (!profile?.is_active) {
      setErr("Seu usuário está inativo.");
      return;
    }
    if (!canPost) {
      setErr("Você ainda não tem permissão para postar. Aceite um convite de colaborador.");
      return;
    }
    if (!file) {
      setErr("Selecione uma foto para postar.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErr("Arquivo inválido. Envie uma imagem.");
      return;
    }

    setSaving(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData?.user;
      if (!user) throw new Error("not authenticated");

      // 1) criar observation
      const { data: oData, error: oErr } = await supabase
        .from("observations")
        .insert({
          created_by: user.id,
          aerodrome_id: aerodrome.id,
          type: obsType,
          caption: caption.trim() || null,
          status: "published",
          privacy,
          source: "user",
          // event_time default now()
        })
        .select("id")
        .single();

      if (oErr) throw oErr;
      const observationId = (oData as any).id as string;

      // 2) upload da imagem
      const bucket = "observer-media";
      const fname = safeFileName(file.name || "image.jpg");
      const storagePath = `observations/${observationId}/${Date.now()}_${fname}`;

      const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

      if (upErr) throw upErr;

      // 3) registrar mídia
      const { error: mErr } = await supabase.from("observation_media").insert({
        observation_id: observationId,
        media_type: "image",
        storage_bucket: bucket,
        storage_path: storagePath,
        mime_type: file.type,
        bytes: file.size,
      });

      if (mErr) throw mErr;

      // 4) redirect pro feed
      router.replace(`/feed/${icao}`);
    } catch (e: any) {
      console.error(e);
      setErr(
        "Falha ao publicar. Verifique sua permissão (colaborador), o aeródromo, e tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Postar — {icao}
          </h1>
          <p style={{ margin: 0, opacity: 0.85 }}>
            {aerodrome?.name ? aerodrome.name : "Criar observação visual"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={`/feed/${icao}`}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              textDecoration: "none",
              opacity: 0.9,
            }}
          >
            Voltar ao feed
          </Link>
          <Link
            href="/me"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              textDecoration: "none",
              opacity: 0.9,
            }}
          >
            Perfil
          </Link>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        {loading && <p>Carregando...</p>}

        {!loading && !canPost && (
          <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
            <p style={{ marginTop: 0 }}>
              Seu acesso atual não permite postagem. Para postar, você precisa ser
              <strong> colaborador</strong>.
            </p>
            <p style={{ marginBottom: 0, opacity: 0.85 }}>
              Abra um link de convite enviado por um colaborador/admin.
            </p>
          </div>
        )}

        {!loading && (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Foto</h2>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={saving || !canPost}
              />

              <div style={{ marginTop: 12 }}>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12 }}
                  />
                ) : (
                  <div
                    style={{
                      height: 180,
                      display: "grid",
                      placeItems: "center",
                      background: "#fafafa",
                      borderRadius: 12,
                      color: "#666",
                    }}
                  >
                    Sem pré-visualização
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>Detalhes</h2>

              <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                <span>Tipo de observação</span>
                <select
                  value={obsType}
                  onChange={(e) => setObsType(e.target.value as ObservationType)}
                  disabled={saving || !canPost}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                >
                  <option value="meteo_visual">{typeLabel("meteo_visual")}</option>
                  <option value="runway">{typeLabel("runway")}</option>
                  <option value="apron_ground">{typeLabel("apron_ground")}</option>
                  <option value="infrastructure">{typeLabel("infrastructure")}</option>
                  <option value="general">{typeLabel("general")}</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                <span>Visibilidade</span>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  disabled={saving || !canPost}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                >
                  <option value="public">Público</option>
                  <option value="collaborators">Somente colaboradores</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Texto (opcional)</span>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ex.: TCU no setor NE, base escura e chuva ao fundo."
                  rows={4}
                  disabled={saving || !canPost}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", resize: "vertical" }}
                />
              </label>

              {err && <p style={{ color: "crimson", marginTop: 12, marginBottom: 0 }}>{err}</p>}

              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={saving || !canPost}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: saving || !canPost ? "not-allowed" : "pointer",
                    opacity: saving || !canPost ? 0.7 : 1,
                  }}
                >
                  {saving ? "Publicando..." : "Publicar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCaption("");
                    setFile(null);
                    setErr("");
                  }}
                  disabled={saving}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  Limpar
                </button>
              </div>
            </div>

            <div style={{ opacity: 0.75, fontSize: 12 }}>
              As observações são complementares e não substituem informações oficiais (REDEMET/AIS).
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
