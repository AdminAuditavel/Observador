//src/app/feed/[icao]/page.tsx

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
  city: string | null;
  uf: string | null;
};

type Observation = {
  id: string;
  created_at: string;
  event_time: string;
  type: string;
  caption: string | null;
  privacy: string;
  status: string;
  created_by: string;
};

type Media = {
  id: string;
  observation_id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
};

function typeLabel(t: string) {
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
    default:
      return t;
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedByIcaoPage() {
  const router = useRouter();
  const params = useParams();

  const icao = useMemo(() => {
    const raw = params?.icao;
    const v = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    return (v || "").toUpperCase();
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [aerodrome, setAerodrome] = useState<Aerodrome | null>(null);
  const [items, setItems] = useState<
    Array<{ obs: Observation; media?: Media | null; mediaUrl?: string | null }>
  >([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");
      setAerodrome(null);
      setItems([]);

      if (!icao || icao.length !== 4) {
        setLoading(false);
        setErr("ICAO inválido.");
        return;
      }

      // 1) sessão
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        if (!mounted) return;
        setErr("Falha ao verificar sessão.");
        setLoading(false);
        return;
      }
      if (!sessionData.session) {
        if (!mounted) return;
        const next = encodeURIComponent(`/feed/${icao}`);
        router.replace(`/login?next=${next}`);
        return;
      }

      // 2) garantir profile (boa prática)
      try {
        await ensureProfile();
      } catch (e) {
        console.error(e);
      }

      // 3) aeródromo
      const { data: aData, error: aErr } = await supabase
        .from("aerodromes")
        .select("id, icao, name, city, uf")
        .eq("icao", icao)
        .single();

      if (!mounted) return;

      if (aErr) {
        console.error(aErr);
        setErr("Aeródromo não encontrado (ou inativo).");
        setLoading(false);
        return;
      }

      const a = aData as Aerodrome;
      setAerodrome(a);

      // 4) observações (RLS já filtra visibilidade)
      const { data: oData, error: oErr } = await supabase
        .from("observations")
        .select("id, created_at, event_time, type, caption, privacy, status, created_by")
        .eq("aerodrome_id", a.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!mounted) return;

      if (oErr) {
        console.error(oErr);
        setErr("Falha ao carregar observações.");
        setLoading(false);
        return;
      }

      const obsList = (oData ?? []) as Observation[];
      if (!obsList.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      // 5) mídia (primeira por observation)
      const obsIds = obsList.map((x) => x.id);

      const { data: mData, error: mErr } = await supabase
        .from("observation_media")
        .select("id, observation_id, storage_bucket, storage_path, mime_type")
        .in("observation_id", obsIds)
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (mErr) {
        console.error(mErr);
        // feed ainda funciona sem mídia
      }

      const mediaByObs = new Map<string, Media>();
      (mData as Media[] | null)?.forEach((m) => {
        if (!mediaByObs.has(m.observation_id)) mediaByObs.set(m.observation_id, m);
      });

      // 6) gerar signed URLs para imagens (bucket é privado)
      const joined: Array<{ obs: Observation; media?: Media | null; mediaUrl?: string | null }> = [];

      for (const obs of obsList) {
        const media = mediaByObs.get(obs.id) ?? null;

        if (media) {
          const { data: signed, error: sErr } = await supabase.storage
            .from(media.storage_bucket)
            .createSignedUrl(media.storage_path, 60 * 10); // 10 min

          if (sErr) {
            console.error("signed url error:", sErr);
            joined.push({ obs, media, mediaUrl: null });
          } else {
            joined.push({ obs, media, mediaUrl: signed?.signedUrl ?? null });
          }
        } else {
          joined.push({ obs, media: null, mediaUrl: null });
        }
      }

      if (!mounted) return;
      setItems(joined);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [icao, router]);

  return (
    <main style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            {aerodrome ? aerodrome.icao : icao}
          </h1>
          <p style={{ margin: 0, opacity: 0.85 }}>
            {aerodrome?.name
              ? `${aerodrome.name}${aerodrome.city || aerodrome.uf ? " — " : ""}${[
                  aerodrome.city,
                  aerodrome.uf,
                ]
                  .filter(Boolean)
                  .join("/")}`
              : "Feed de observações"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={`/post/${icao}`}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              textDecoration: "none",
            }}
          >
            Postar
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
        {loading && <p>Carregando feed...</p>}
        {!loading && err && <p style={{ color: "crimson" }}>{err}</p>}

        {!loading && !err && items.length === 0 && (
          <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
            <p style={{ margin: 0 }}>
              Ainda não há observações para este aeródromo. Clique em <strong>Postar</strong> para criar a primeira.
            </p>
          </div>
        )}

        {!loading && !err && items.length > 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            {items.map(({ obs, mediaUrl }) => (
              <article
                key={obs.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl}
                    alt="Observação"
                    style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      height: 180,
                      display: "grid",
                      placeItems: "center",
                      background: "#fafafa",
                      color: "#666",
                    }}
                  >
                    Sem imagem
                  </div>
                )}

                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{typeLabel(obs.type)}</strong>
                    <span style={{ opacity: 0.8, fontSize: 12 }}>{formatTime(obs.event_time)}</span>
                  </div>

                  {obs.caption ? (
                    <p style={{ marginTop: 10, marginBottom: 0, whiteSpace: "pre-wrap" }}>{obs.caption}</p>
                  ) : (
                    <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.7 }}>(Sem texto)</p>
                  )}

                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                    Visibilidade: {obs.privacy === "public" ? "Público" : "Colaboradores"}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 18, opacity: 0.75, fontSize: 12 }}>
        As observações são complementares e não substituem informações oficiais (REDEMET/AIS).
      </footer>
    </main>
  );
}
