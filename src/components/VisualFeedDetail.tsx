//src/components/VisualFeedDetail.tsx

// src/components/VisualFeedDetail.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

type Observation = {
  id: string;
  created_at: string;
  event_time: string | null;
  type: string;
  caption: string | null;
  privacy: "public" | "collaborators";
  status: string;
  created_by: string;
  aerodrome_id: string;
};

type Media = {
  id: string;
  observation_id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  bytes: number | null;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

type Aerodrome = {
  id: string;
  icao: string;
  name: string | null;
};

function relativeTime(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.max(1, Math.floor((now - t) / 1000));
  const min = Math.floor(diffSec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) return `${day}d`;
  if (hr > 0) return `${hr}h`;
  if (min > 0) return `${min}m`;
  return `${diffSec}s`;
}

function typeBadge(type: string) {
  switch (type) {
    case "meteo_visual":
      return "Meteorologia";
    case "runway":
      return "Pista";
    case "apron_ground":
      return "Pátio";
    case "infrastructure":
      return "Infra";
    case "general":
      return "Geral";
    default:
      return "Obs";
  }
}

const FALLBACK_BG =
  "https://images.unsplash.com/photo-1521727857535-28d204b23c29?auto=format&fit=crop&q=80&w=1200";
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=160&h=160";

const VisualFeedDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [obs, setObs] = useState<Observation | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [author, setAuthor] = useState<Profile | null>(null);
  const [aerodrome, setAerodrome] = useState<Aerodrome | null>(null);

  const timestamp = useMemo(() => {
    const t = obs?.event_time || obs?.created_at;
    return t ? relativeTime(t) : "";
  }, [obs?.event_time, obs?.created_at]);

  const collaborativeLabel = useMemo(() => {
    if (!obs) return "Colaborativo";
    return obs.privacy === "collaborators" ? "Colaborativo" : "Público";
  }, [obs]);

  const isVerified = useMemo(() => {
    const r = author?.role;
    return r === "admin" || r === "collaborator";
  }, [author?.role]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");
      setObs(null);
      setMediaUrl("");
      setAuthor(null);
      setAerodrome(null);

      if (!id) {
        setErr("Post inválido.");
        setLoading(false);
        return;
      }

      // Se você quiser exigir login para ver detalhe:
      // (Se o seu app permite visualização sem login, remova esse bloco.)
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error(sessionErr);
        setErr("Falha ao verificar sessão.");
        setLoading(false);
        return;
      }
      if (!sessionData.session) {
        navigate("/login", { replace: true });
        return;
      }

      // 1) observation
      const { data: oData, error: oErr } = await supabase
        .from("observations")
        .select("id, created_at, event_time, type, caption, privacy, status, created_by, aerodrome_id")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (oErr) {
        console.error(oErr);
        setErr("Não foi possível carregar esta observação (sem permissão ou inexistente).");
        setLoading(false);
        return;
      }

      const o = oData as Observation;
      setObs(o);

      // 2) aerodrome (para localização)
      const { data: aData, error: aErr } = await supabase
        .from("aerodromes")
        .select("id, icao, name")
        .eq("id", o.aerodrome_id)
        .single();

      if (!mounted) return;

      if (!aErr && aData) setAerodrome(aData as Aerodrome);

      // 3) profile do autor
      // Se sua policy de profiles bloquear (muito provável), use a view profiles_public:
      //   .from("profiles_public") em vez de .from("profiles")
      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role")
        .eq("id", o.created_by)
        .single();

      if (!mounted) return;

      if (pErr) {
        console.warn("profiles select blocked or error:", pErr);
        // fallback mantém layout
      } else {
        setAuthor(pData as Profile);
      }

      // 4) primeira mídia + signed URL (bucket privado)
      const { data: mData, error: mErr } = await supabase
        .from("observation_media")
        .select("id, observation_id, storage_bucket, storage_path, mime_type, bytes, created_at")
        .eq("observation_id", o.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (!mounted) return;

      if (mErr) {
        console.error(mErr);
        setLoading(false);
        return;
      }

      const media = (mData ?? [])[0] as Media | undefined;
      if (media?.storage_bucket && media?.storage_path) {
        const { data: signed, error: sErr } = await supabase.storage
          .from(media.storage_bucket)
          .createSignedUrl(media.storage_path, 60 * 10); // 10 min

        if (!mounted) return;

        if (sErr) {
          console.error(sErr);
        } else {
          setMediaUrl(signed?.signedUrl ?? "");
        }
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const authorName = author?.display_name || "Colaborador";
  const authorAvatar = author?.avatar_url || FALLBACK_AVATAR;

  const locationText = aerodrome
    ? `${aerodrome.icao}${aerodrome.name ? ` — ${aerodrome.name}` : ""}`
    : "Aeródromo";

  const contentText = obs?.caption || "(Sem texto)";
  const backgroundImage = mediaUrl || FALLBACK_BG;

  if (loading) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-black text-white">
        Carregando...
      </div>
    );
  }

  if (err) {
    return (
      <div className="relative h-screen w-full flex flex-col bg-black text-white p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="mt-6">{err}</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex flex-col bg-black overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        <img src={backgroundImage} className="w-full h-full object-cover opacity-80" alt="Context" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/30">
          <span className="material-symbols-outlined text-amber-300 text-[18px]">group</span>
          <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide">
            {collaborativeLabel}
          </span>
        </div>

        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
          <span className="material-symbols-outlined text-white">more_vert</span>
        </button>
      </div>

      <div className="flex-1"></div>

      {/* Bottom Content */}
      <div className="relative z-10 w-full p-5 pb-12 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={authorAvatar}
              className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
              alt={authorName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
              }}
            />
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-[2px] border border-black">
                <span className="material-symbols-outlined text-[14px]">check</span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg drop-shadow-md">{authorName}</span>

              {isVerified && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm uppercase">
                  Verified
                </span>
              )}

              {obs?.type && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/90 backdrop-blur-sm uppercase">
                  {typeBadge(obs.type)}
                </span>
              )}
            </div>

            <div className="flex items-center text-white/80 text-sm gap-3 font-medium">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>{timestamp} atrás</span>
              </div>

              {/* distância ainda não existe no modelo MVP */}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-white/90">
            <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
            <p className="font-semibold text-lg leading-tight">{locationText}</p>
          </div>

          <p className="text-white/80 text-base leading-relaxed pl-7 drop-shadow-sm">
            {contentText}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {/* Confirmar / Chat / Report: integraremos depois */}
          <button className="flex-1 h-14 bg-primary hover:bg-blue-600 active:bg-blue-700 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
            <span className="material-symbols-outlined text-white">thumb_up</span>
            <span className="text-white font-bold text-base">Confirmar</span>
          </button>

          <button className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-0.5 text-white">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="text-[10px] font-bold">3</span>
          </button>

          <button className="h-14 w-14 rounded-xl bg-red-500/10 backdrop-blur-md border border-red-500/20 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined">report_problem</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualFeedDetail;
