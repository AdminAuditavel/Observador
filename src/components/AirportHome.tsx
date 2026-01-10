// src/components/AirportHome.tsx

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/AuthContext";
import { VisualPost } from "../types";
import NewPostModal from "./NewPostModal";
import { AIRPORT_SBSP, TIMELINE_SBSP } from "../services/mockData";

// Função para normalizar a busca para ICAO
const phoneticMap: Record<string, string> = {
  ALFA: "A", ALPHA: "A", BRAVO: "B", CHARLIE: "C", DELTA: "D", ECHO: "E", FOXTROT: "F",
  GOLF: "G", HOTEL: "H", INDIA: "I", JULIETT: "J", JULIET: "J", KILO: "K", LIMA: "L",
  MIKE: "M", NOVEMBER: "N", OSCAR: "O", PAPA: "P", QUEBEC: "Q", ROMEO: "R", SIERRA: "S",
  TANGO: "T", UNIFORM: "U", VICTOR: "V", WHISKEY: "W", XRAY: "X", "X-RAY": "X", YANKEE: "Y", ZULU: "Z",
};

const normalizeSearchToIcao = (input: string): string | null => {
  const cleaned = input.trim().toUpperCase();
  const onlyLetters = cleaned.replace(/[^A-Z]/g, "");
  if (onlyLetters.length >= 3 && onlyLetters.length <= 4) {
    return onlyLetters;
  }

  const tokens = cleaned.split(/[\s,.-]+/).map((t) => t.replace(/[^A-Z]/g, "")).filter(Boolean);
  const letters: string[] = [];

  for (const tok of tokens) {
    const mapped = phoneticMap[tok];
    if (mapped) {
      letters.push(mapped);
    }
    if (/^[A-Z]{3,4}$/.test(tok)) {
      letters.push(...tok.split(""));
    }
  }
  return letters.length >= 3 && letters.length <= 4 ? letters.join("") : null;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=800";
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=200&h=200&crop=faces";

const AirportHome: React.FC = ({ onOpenWeather }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<VisualPost[]>([]);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const recognitionRef = useRef<any>(null);

  const USER_AVATAR = posts?.[0]?.authorAvatar || FALLBACK_AVATAR;

  const handleAddPost = (newPost: VisualPost) => setPosts([newPost, ...posts]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = normalizeSearchToIcao(searchQuery);
    if (result) navigate(`/airport/${result}`);
    else alert('Código não reconhecido. Digite ex: SBSP ou fale "Sierra Bravo Sierra Papa".');
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Reconhecimento de voz não suportado neste navegador.");

    if (!recognitionRef.current) {
      const r = new SpeechRecognition();
      recognitionRef.current = r;
      r.lang = "en-US";
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.continuous = false;

      r.onstart = () => setIsListening(true);
      r.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((res: any) => res[0].transcript).join(" ").trim();
        setSearchQuery(transcript);
        const normalized = normalizeSearchToIcao(transcript);
        if (normalized) navigate(`/airport/${normalized}`);
      };
      r.onerror = () => setIsListening(false);
      r.onend = () => setIsListening(false);
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {}
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  useEffect(() => {
    let mounted = true;
    const loadVisualFeed = async () => {
      try {
        const { data: aerodrome, error: aErr } = await supabase
          .from("aerodromes")
          .select("id, icao, name")
          .eq("icao", AIRPORT_SBSP.icao)
          .single();
        if (aErr) throw aErr;

        const { data: obs, error: oErr } = await supabase
          .from("observations")
          .select("id, created_at, event_time, type, caption, privacy, created_by, aerodrome_id")
          .eq("aerodrome_id", aerodrome.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (oErr) throw oErr;

        const obsList = obs ?? [];
        const mapped: VisualPost[] = obsList.map((o) => ({
          id: o.id,
          author: "Colaborador",
          authorRole: "Colaborador",
          authorAvatar: FALLBACK_AVATAR,
          content: o.caption || "(Sem texto)",
          imageUrl: FALLBACK_IMAGE,
          timestamp: "5m",
          likes: 0,
          confidence: "Alta Confiança",
          location: `${AIRPORT_SBSP.icao} ${aerodrome.name}`,
        }));

        if (mounted) setPosts(mapped);
      } catch (e) {
        console.error(e);
        if (mounted) setPosts([]);
      }
    };
    loadVisualFeed();
    return () => {
      mounted = false;
    };
  }, []);

  const openNewPost = () => setIsNewPostModalOpen(true);

  return (
    <div className="flex flex-col pb-20">
      <header className="relative w-full h-[320px] shrink-0">
        <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${AIRPORT_SBSP.bgImage})` }} />
        <div className="relative z-10 flex flex-col h-full justify-between p-4 pb-6">
          <div className="relative flex items-center justify-between">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar (SBSP ou Sierra Bravo Sierra Papa)" className="h-10 text-sm bg-black/20 backdrop-blur-md placeholder-gray-300 text-white px-3 rounded-full border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary w-[220px] md:w-[320px]" />
                <button type="submit" className="flex items-center justify-center h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>
                <button type="button" aria-pressed={isListening} onClick={() => (isListening ? stopListening() : startListening())} title={isListening ? "Parar escuta" : "Falar (alfabeto fonético)"} className={`flex items-center justify-center h-10 w-10 rounded-full border ${isListening ? "bg-red-600 border-red-700" : "bg-black/20 border-white/10"} text-white`}>
                  <span className="material-symbols-outlined text-[18px]">{isListening ? "mic" : "mic_none"}</span>
                </button>
              </form>
            </div>
            <button aria-label="Abrir perfil" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 overflow-hidden">
              <img src={USER_AVATAR} alt="Avatar do usuário" className="h-10 w-10 object-cover rounded-full" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight tracking-tight drop-shadow-lg">{AIRPORT_SBSP.name}</h1>
              <button aria-pressed={isFavorited} onClick={() => setIsFavorited((prev) => !prev)} className={`flex items-center justify-center h-9 w-9 rounded-full ${isFavorited ? "bg-yellow-500 text-white" : "bg-white/5 text-gray-300 border border-white/10"}`}>
                <span className="material-symbols-outlined text-[18px]">{isFavorited ? "star" : "star_outline"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-6 -mt-4 relative z-10 px-4">
        <section>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-white text-base font-bold">Linha do Tempo</h3>
            <span className="text-xs text-primary font-medium cursor-pointer">Ver tudo</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
            {TIMELINE_SBSP.map((item) => (
              <div key={item.id} className="snap-start shrink-0 flex flex-col items-start gap-2 min-w-[130px] p-3 rounded-lg bg-surface-dark border-l-2 border-primary shadow-sm">
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

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-base font-bold">Feed Visual</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">Colaborativo</span>
            </div>
            <button onClick={() => {
              if (!user || user.role !== "collaborator") {
                setShowInviteModal(true); // Abre o modal de convite
                return;
              }
              openNewPost();
            }} className="flex items-center justify-center h-14 w-14 rounded-full bg-gray-800 text-white">
              <span className="material-symbols-outlined">photo_camera</span>
            </button>
          </div>
          {posts.map((post) => (
            <article key={post.id} onClick={() => navigate(`/post/${post.id}`, { state: { background: location } })} className="bg-surface-dark rounded-xl overflow-hidden border border-white/5 shadow-lg active:scale-[0.99] transition-all cursor-pointer group">
              <div className="relative h-48 w-full bg-gray-800 overflow-hidden">
                <img src={post.imageUrl} alt={post.content} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span> {post.timestamp}
                  </span>
                </div>
                {post.confidence === "Alta Confiança" && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-md bg-green-500 text-[10px] font-bold text-white flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] fill-current">verified</span> {post.confidence}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <p className="text-white font-medium text-sm leading-tight line-clamp-2 drop-shadow-md">{post.content}</p>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={post.authorAvatar} alt={post.author} className="h-8 w-8 rounded-full object-cover border-2 border-surface-dark-lighter" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_AVATAR; }} />
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

      {isNewPostModalOpen && (
        <NewPostModal onClose={() => setIsNewPostModalOpen(false)} onAdd={handleAddPost} />
      )}

      {/* Modal de Acesso por Convite */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Acesso por convite necessário!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Para criar um post, você precisa estar logado como colaborador. Solicite um convite ou
              faça login.
            </p>
            <button
              onClick={() => { navigate("/login"); setShowInviteModal(false); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
            >
              Fazer login
            </button>
            <div className="mt-3">
              <button
                onClick={() => { navigate("/signup"); setShowInviteModal(false); }}
                className="text-sm text-blue-600 hover:underline"
              >
                Solicitar convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirportHome;
