// src/components/AirportHome.tsx

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AIRPORT_SBSP, TIMELINE_SBSP } from "../services/mockData";
import { VisualPost } from "../types";
import NewPostModal from "./NewPostModal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";

interface AirportHomeProps {
  onOpenWeather: () => void;
}

/**
 * Mapa fonético (NATO) -> letra.
 * Inclui variantes comuns (ALFA/ALPHA, JULIETT/JULIET, XRAY/X-RAY).
 */
const phoneticMap: Record<string, string> = {
  ALFA: "A",
  ALPHA: "A",
  BRAVO: "B",
  CHARLIE: "C",
  DELTA: "D",
  ECHO: "E",
  FOXTROT: "F",
  GOLF: "G",
  HOTEL: "H",
  INDIA: "I",
  JULIETT: "J",
  JULIET: "J",
  KILO: "K",
  LIMA: "L",
  MIKE: "M",
  NOVEMBER: "N",
  OSCAR: "O",
  PAPA: "P",
  QUEBEC: "Q",
  ROMEO: "R",
  SIERRA: "S",
  TANGO: "T",
  UNIFORM: "U",
  VICTOR: "V",
  WHISKEY: "W",
  XRAY: "X",
  "X-RAY": "X",
  YANKEE: "Y",
  ZULU: "Z",
};

const normalizeSearchToIcao = (input: string): string | null => {
  if (!input) return null;
  const cleaned = input.trim().toUpperCase();

  // If input already looks like a code (letters only, 3-4)
  const onlyLetters = cleaned.replace(/[^A-Z]/g, "");
  if (
    onlyLetters.length >= 3 &&
    onlyLetters.length <= 4 &&
    /^[A-Z]{3,4}$/.test(onlyLetters)
  ) {
    return onlyLetters;
  }

  // Tokens: split by spaces, commas, hyphens, dots
  const tokens = cleaned
    .split(/[\s,.-]+/)
    .map((t) => t.replace(/[^A-Z]/g, ""))
    .filter(Boolean);
  const letters: string[] = [];

  for (const tok of tokens) {
    if (!tok) continue;

    // single-letter token "S" or "B"
    if (tok.length === 1 && /^[A-Z]$/.test(tok)) {
      letters.push(tok);
      continue;
    }

    // full phonetic word
    const mapped = phoneticMap[tok];
    if (mapped) {
      letters.push(mapped);
      continue;
    }

    // fallback: token with 3-4 letters (maybe input like "SBSP" without spaces)
    if (/^[A-Z]{3,4}$/.test(tok)) {
      letters.push(...tok.split(""));
      continue;
    }
  }

  if (letters.length >= 3 && letters.length <= 4) {
    return letters.slice(0, 4).join("");
  }

  return null;
};

type Observation = {
  id: string;
  created_at: string;
  event_time: string;
  type: string;
  caption: string | null;
  privacy: "public" | "collaborators";
  created_by: string;
  aerodrome_id: string;
};

type Media = {
  observation_id: string;
  storage_bucket: string;
  storage_path: string;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

function relativeTimeShort(iso: string) {
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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=800";
const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=200&h=200&crop=faces";

const AirportHome: React.FC<AirportHomeProps> = ({ onOpenWeather }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<VisualPost[]>([]);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Use a sensible default avatar (can be replaced by actual user data later)
  const USER_AVATAR = posts?.[0]?.authorAvatar || FALLBACK_AVATAR;

  const handleAddPost = (newPost: VisualPost) => {
    // mantém comportamento atual do modal (apenas UI/local)
    setPosts([newPost, ...posts]);
  };

  const openNewPost = () => {
    setIsNewPostModalOpen(true);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = normalizeSearchToIcao(searchQuery);
    if (result) {
      navigate(`/airport/${result}`);
      setSearchQuery("");
    } else {
      // eslint-disable-next-line no-alert
      alert('Código não reconhecido. Digite ex: SBSP ou fale "Sierra Bravo Sierra Papa".');
    }
  };

  // Voice recognition using Web Speech API
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // eslint-disable-next-line no-alert
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (!recognitionRef.current) {
      const r = new SpeechRecognition();
      recognitionRef.current = r;

      // NATO words are in English; 'en-US' usually recognizes them better. Change to 'pt-BR' if preferred.
      r.lang = "en-US";
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.continuous = false;

      r.onstart = () => setIsListening(true);

      r.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join(" ")
          .trim();
        setSearchQuery(transcript);
        const normalized = normalizeSearchToIcao(transcript);
        if (normalized) {
          navigate(`/airport/${normalized}`);
          setSearchQuery("");
        }
      };

      r.onerror = () => {
        setIsListening(false);
      };

      r.onend = () => {
        setIsListening(false);
      };
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // ignore start errors (already listening)
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  /**
   * CARREGAR FEED VISUAL DO SUPABASE
   * - Busca aeródromo SBSP (por enquanto fixo, pois esta home é SBSP no mock)
   * - Lista observations mais recentes
   * - Busca primeira mídia e assina URL
   * - Busca perfis dos autores (pode depender de policy; fallback mantém UI)
   */
  useEffect(() => {
    let mounted = true;

    async function loadVisualFeed() {
      // Se você quiser forçar login aqui, descomente:
      // const { data: sessionData } = await supabase.auth.getSession();
      // if (!sessionData.session) return;

      try {
        // 1) aeródromo por ICAO (SBSP)
        const { data: aerodrome, error: aErr } = await supabase
          .from("aerodromes")
          .select("id, icao, name")
          .eq("icao", AIRPORT_SBSP.icao)
          .single();

        if (aErr) throw aErr;
        if (!aerodrome?.id) throw new Error("Aeródromo não encontrado");

        // 2) observations
        const { data: obs, error: oErr } = await supabase
          .from("observations")
          .select("id, created_at, event_time, type, caption, privacy, created_by, aerodrome_id")
          .eq("aerodrome_id", aerodrome.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (oErr) throw oErr;

        const obsList = (obs ?? []) as Observation[];
        if (!obsList.length) {
          if (mounted) setPosts([]);
          return;
        }

        const obsIds = obsList.map((x) => x.id);
        const authorIds = Array.from(new Set(obsList.map((x) => x.created_by)));

        // 3) mídias (primeira por observation)
        const { data: mediaRows, error: mErr } = await supabase
          .from("observation_media")
          .select("observation_id, storage_bucket, storage_path, created_at")
          .in("observation_id", obsIds)
          .order("created_at", { ascending: true });

        if (mErr) throw mErr;

        const mediaByObs = new Map<string, Media>();
        (mediaRows as any[] | null)?.forEach((m) => {
          if (!mediaByObs.has(m.observation_id)) mediaByObs.set(m.observation_id, m as Media);
        });

        // 4) perfis dos autores (pode falhar por RLS -> fallback)
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, role")
          .in("id", authorIds);

        if (pErr) {
          // Se sua policy bloquear, seguimos com fallback.
          console.warn("profiles select blocked or error:", pErr);
        }
        
        // 4.5) contagem de confirmações (1 query)
        const { data: countsRows, error: cErr } = await supabase
          .from("observation_confirmation_counts")
          .select("observation_id, confirms")
          .in("observation_id", obsIds);
        
        if (cErr) console.warn("confirmation counts error:", cErr);
        
        const confirmsByObs = new Map<string, number>();
        (countsRows as any[] | null)?.forEach((r) => {
          confirmsByObs.set(r.observation_id, Number(r.confirms || 0));
        });

        const profileById = new Map<string, Profile>();
        (profiles as any[] | null)?.forEach((p) => profileById.set(p.id, p as Profile));

        // 5) signed urls (bucket privado)
        const signedUrlByObs = new Map<string, string>();
        for (const o of obsList) {
          const m = mediaByObs.get(o.id);
          if (!m) continue;

          const { data: signed, error: sErr } = await supabase.storage
            .from(m.storage_bucket)
            .createSignedUrl(m.storage_path, 60 * 10);

          if (!sErr && signed?.signedUrl) signedUrlByObs.set(o.id, signed.signedUrl);
        }

        // 6) map para VisualPost (mantém seu layout)
        const mapped: VisualPost[] = obsList.map((o) => {
          const p = profileById.get(o.created_by);
          const t = o.event_time || o.created_at;

          return {
            id: o.id,
            author: p?.display_name || "Colaborador",
            authorRole: p?.role === "admin" ? "Admin" : p?.role === "collaborator" ? "Colaborador" : "Usuário",
            authorAvatar: p?.avatar_url || FALLBACK_AVATAR,
            content: o.caption || "(Sem texto)",
            imageUrl: signedUrlByObs.get(o.id) || FALLBACK_IMAGE,
            timestamp: `${relativeTimeShort(t)}`,
            likes: confirmsByObs.get(o.id) ?? 0,
            confidence: "Alta Confiança", // placeholder (MVP). Depois ligamos a confirmações.
            location: `${AIRPORT_SBSP.icao}${aerodrome.name ? ` — ${aerodrome.name}` : ""}`,
            distance: "", // ainda não temos no modelo MVP
          };
        });

        if (mounted) setPosts(mapped);
      } catch (e) {
        console.error(e);
        // fallback: mantém vazio ou poderia cair no mock
        if (mounted) setPosts([]);
      }
    }

    loadVisualFeed();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col pb-20">
      {/* Header with Background */}
      <header className="relative w-full h-[320px] shrink-0">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${AIRPORT_SBSP.bgImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#111722]"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between p-4 pb-6">
          {/* Top row */}
          <div className="relative flex items-center justify-between">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="absolute left-1/2 top-0 transform -translate-x-1/2">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar (SBSP ou Sierra Bravo Sierra Papa)"
                  aria-label="Buscar aeroporto por código ou alfabeto fonético"
                  className="h-10 text-sm bg-black/20 backdrop-blur-md placeholder-gray-300 text-white px-3 rounded-full border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary w-[220px] md:w-[320px] transition-all"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/30 active:scale-95 transition-all"
                  aria-label="Pesquisar"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>

                <button
                  type="button"
                  aria-pressed={isListening}
                  onClick={() => (isListening ? stopListening() : startListening())}
                  title={isListening ? "Parar escuta" : "Falar (alfabeto fonético)"}
                  className={`flex items-center justify-center h-10 w-10 rounded-full border ${
                    isListening ? "bg-red-600 border-red-700" : "bg-black/20 border-white/10"
                  } text-white transition-all`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isListening ? "mic" : "mic_none"}
                  </span>
                </button>
              </form>
            </div>

            <button
              aria-label="Abrir perfil"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 overflow-hidden"
              onClick={() => {
                // navigate('/profile');
              }}
            >
              <img src={USER_AVATAR} alt="Avatar do usuário" className="h-10 w-10 object-cover rounded-full" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/10 uppercase">
                  {AIRPORT_SBSP.icao} / {AIRPORT_SBSP.iata}
                </span>

                <span className="text-xs font-medium text-gray-300">• {AIRPORT_SBSP.distance}</span>
                <span className="text-xs font-medium text-gray-300 ml-auto flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">update</span> {AIRPORT_SBSP.lastUpdate}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight tracking-tight drop-shadow-lg">
                  {AIRPORT_SBSP.name}
                </h1>

                <button
                  aria-pressed={isFavorited}
                  onClick={() => setIsFavorited((prev) => !prev)}
                  title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  className={`flex items-center justify-center h-9 w-9 rounded-full transition-all ${
                    isFavorited ? "bg-yellow-500 text-white" : "bg-white/5 text-gray-300 border border-white/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isFavorited ? "star" : "star_outline"}
                  </span>
                </button>
              </div>
            </div>

            <button className="flex w-full items-center justify-center h-11 bg-primary hover:bg-blue-600 active:bg-blue-700 transition-colors rounded-lg text-white gap-2 px-4 text-sm font-bold shadow-lg shadow-blue-900/20">
              <span className="material-symbols-outlined text-[20px]">map</span>
              <span>Ver mapa / rota</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col gap-6 -mt-4 relative z-10 px-4">
        {/* Official Summary Card */}
        <section
          onClick={onOpenWeather}
          className="bg-surface-dark rounded-xl border border-white/5 shadow-xl overflow-hidden cursor-pointer hover:bg-surface-dark-lighter transition-colors"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-surface-dark-lighter/30">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-lg font-bold">Resumo Oficial</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                Oficial
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-400">{AIRPORT_SBSP.status}</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="bg-[#111722] p-3 rounded-lg border-l-4 border-green-500 font-mono text-xs leading-relaxed text-gray-300">
              {AIRPORT_SBSP.metar}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <StatItem icon="navigation" label="Vento" value={AIRPORT_SBSP.stats.wind} rotate="rotate-45" />
              <StatItem icon="visibility" label="Visib." value={AIRPORT_SBSP.stats.visibility} />
              <StatItem icon="cloud" label="Teto" value={AIRPORT_SBSP.stats.ceiling} />
              <StatItem icon="flight_takeoff" label="Pista" value={AIRPORT_SBSP.stats.runway} color="text-green-500" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">NOTAMs Críticos</span>
              <div className="flex flex-wrap gap-2">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/notam/n1");
                  }}
                  className="flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 pl-2 pr-3 py-1 cursor-pointer hover:bg-yellow-500/20"
                >
                  <span className="material-symbols-outlined text-yellow-500 text-[16px]">warning</span>
                  <p className="text-yellow-200 text-xs font-medium">Obras na TWY Charlie</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-white text-base font-bold">Linha do Tempo</h3>
            <span className="text-xs text-primary font-medium cursor-pointer">Ver tudo</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
            {TIMELINE_SBSP.map((item) => (
              <div
                key={item.id}
                className="snap-start shrink-0 flex flex-col items-start gap-2 min-w-[130px] p-3 rounded-lg bg-surface-dark border-l-2 border-primary shadow-sm"
              >
                <span className="text-xs text-gray-400 font-mono">{item.time}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[18px] text-white`}>{item.icon}</span>
                  <span className="text-xs font-bold text-white">{item.title}</span>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight">{item.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Feed Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-base font-bold">Feed Visual</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Colaborativo
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!user || user.role !== "collaborator") {
                    setShowInviteModal(true); // Abre o modal de convite
                    return;
                  }
                  openNewPost(); // Abre o modal de postagem para colaboradores
                }}
                className="flex items-center justify-center h-14 w-14 rounded-full bg-gray-800 text-white"
                aria-label="Criar um novo post"
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>

              {/* Se usuário não é colaborador, ainda oferecemos o link para solicitar convite */}
              {!user || user.role !== "collaborator" ? (
                <button
                  onClick={() => navigate("/signup")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Solicitar convite
                </button>
              ) : null}
            </div>
          </div>

          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => {
                navigate(`/post/${post.id}`, { state: { background: location } });
              }}
              className="bg-surface-dark rounded-xl overflow-hidden border border-white/5 shadow-lg active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="relative h-48 w-full bg-gray-800 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.content}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span> {post.timestamp}
                  </span>
                </div>
                {post.confidence === "Alta Confiança" && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-md bg-green-500 text-[10px] font-bold text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] fill-current">verified</span>{" "}
                      {post.confidence}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <p className="text-white font-medium text-sm leading-tight line-clamp-2 drop-shadow-md">
                    {post.content}
                  </p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="h-8 w-8 rounded-full object-cover border-2 border-surface-dark-lighter"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{post.author}</span>
                    <span className="text-[10px] text-gray-400">{post.authorRole}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                    <span className="text-xs font-medium">{post.likes}</span>
                  </button>
                  <button className="text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">flag</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Modal de Convite */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Acesso por convite necessário!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Para criar um post, você precisa estar logado como colaborador. Solicite um convite ou faça login.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  navigate("/login");
                  setShowInviteModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
              >
                Fazer login
              </button>
              <button
                onClick={() => {
                  navigate("/signup");
                  setShowInviteModal(false);
                }}
                className="px-4 py-2 bg-transparent text-blue-600 rounded-md hover:underline transition-all"
              >
                Solicitar convite
              </button>
            </div>
            <button
              onClick={() => setShowInviteModal(false)}
              className="mt-4 text-sm text-gray-500 hover:underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {isNewPostModalOpen && (
        <NewPostModal onClose={() => setIsNewPostModalOpen(false)} onAdd={handleAddPost} />
      )}

      {/* Footer Disclaimer */}
      <footer className="fixed bottom-0 w-full z-50 bg-[#111722]/90 backdrop-blur-lg border-t border-white/5 py-2 px-4">
        <div className="flex items-start justify-center gap-2 max-w-md mx-auto">
          <span className="material-symbols-outlined text-yellow-500 text-[14px] mt-0.5">warning</span>
          <p className="text-[10px] leading-tight text-gray-400 text-center">
            Informação complementar. Não substitui briefings oficiais. O piloto em comando é a autoridade final.
          </p>
        </div>
      </footer>
    </div>
  );
};

const StatItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  rotate?: string;
  color?: string;
}> = ({ icon, label, value, rotate = "", color = "text-gray-400" }) => (
  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 gap-1">
    <span className={`material-symbols-outlined ${color} text-[20px] ${rotate}`}>{icon}</span>
    <div className="text-center">
      <span className="block text-xs text-gray-400">{label}</span>
      <span className="block text-sm font-bold text-white">{value}</span>
    </div>
  </div>
);

export default AirportHome;
