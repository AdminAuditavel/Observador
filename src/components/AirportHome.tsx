//src/components/AirportHome.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIRPORT_SBSP, TIMELINE_SBSP, POSTS_SBSP } from '../services/mockData';
import { VisualPost } from '../types';
import NewPostModal from './NewPostModal';

interface AirportHomeProps {
  onOpenWeather: () => void;
}

/**
 * Mapa fonético (NATO) -> letra.
 * Inclui variantes comuns (ALFA/ALPHA, JULIETT/JULIET, XRAY/X-RAY).
 */
const phoneticMap: Record<string, string> = {
  ALFA: 'A', ALPHA: 'A',
  BRAVO: 'B',
  CHARLIE: 'C',
  DELTA: 'D',
  ECHO: 'E',
  FOXTROT: 'F',
  GOLF: 'G',
  HOTEL: 'H',
  INDIA: 'I',
  JULIETT: 'J', JULIET: 'J',
  KILO: 'K',
  LIMA: 'L',
  MIKE: 'M',
  NOVEMBER: 'N',
  OSCAR: 'O',
  PAPA: 'P',
  QUEBEC: 'Q',
  ROMEO: 'R',
  SIERRA: 'S',
  TANGO: 'T',
  UNIFORM: 'U',
  VICTOR: 'V',
  WHISKEY: 'W',
  XRAY: 'X',
  'X-RAY': 'X',
  YANKEE: 'Y',
  ZULU: 'Z',
};

/**
 * Normaliza a entrada do usuário tentando extrair um código ICAO (3-4 letras).
 * Suporta:
 * - códigos diretos: "SBSP", "sbsp", "S B S P"
 * - alfabeto fonético: "SIERRA BRAVO SIERRA PAPA", "Sierra Bravo Sierra Papa"
 * - letras isoladas: "S B S P"
 * Retorna o ICAO (uppercase) ou null se não for possível extrair.
 */
const normalizeSearchToIcao = (input: string): string | null => {
  if (!input) return null;
  const cleaned = input.trim().toUpperCase();

  // Se já parece um código (apenas letras, 3 ou 4)
  const onlyLetters = cleaned.replace(/[^A-Z]/g, '');
  if (onlyLetters.length >= 3 && onlyLetters.length <= 4 && /^[A-Z]{3,4}$/.test(onlyLetters)) {
    return onlyLetters;
  }

  // Tokens: separa por espaços, vírgulas, hífens, pontos
  const tokens = cleaned.split(/[\s,.-]+/).map(t => t.replace(/[^A-Z]/g, '')).filter(Boolean);
  const letters: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    // token único como letra: "S" "B"
    if (tok.length === 1 && /^[A-Z]$/.test(tok)) {
      letters.push(tok);
      continue;
    }

    // token completo do alfabeto fonético
    const mapped = phoneticMap[tok];
    if (mapped) {
      letters.push(mapped);
      continue;
    }

    // fallback: token com 3-4 letras (talvez o usuário digitou "SBSP" sem espaços)
    if (/^[A-Z]{3,4}$/.test(tok)) {
      letters.push(...tok.split(''));
      continue;
    }

    // Ignora tokens desconhecidos
  }

  // Se conseguimos extrair 3 ou 4 letras, retorna o ICAO
  if (letters.length >= 3 && letters.length <= 4) {
    return letters.slice(0, 4).join('');
  }

  return null;
};

const AirportHome: React.FC<AirportHomeProps> = ({ onOpenWeather }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<VisualPost[]>(POSTS_SBSP);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleAddPost = (newPost: VisualPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = normalizeSearchToIcao(searchQuery);
    if (result) {
      navigate(`/airport/${result}`);
      setSearchQuery('');
    } else {
      // Ajuste: trocar por um feedback visual se preferir
      // eslint-disable-next-line no-alert
      alert('Código não reconhecido. Digite ex: SBSP ou fale "Sierra Bravo Sierra Papa".');
    }
  };

  // Inicia reconhecimento de voz (Web Speech API). Ao obter resultado, coloca no campo e tenta navegar automaticamente.
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // eslint-disable-next-line no-alert
      alert('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    // Se já existe uma instância, apenas (re)usa
    if (!recognitionRef.current) {
      const r = new SpeechRecognition();
      recognitionRef.current = r;

      // Ajuste de idioma: NATO é inglês, mas muitos usuários falarão em pt-BR (palavras como "SIERRA" são as mesmas).
      // Usar 'en-US' geralmente funciona melhor para palavras do alfabeto fonético; se preferir, mude para 'pt-BR'.
      r.lang = 'en-US';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.continuous = false;

      r.onstart = () => setIsListening(true);

      r.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join(' ')
          .trim();
        // Coloca transcrito no campo
        setSearchQuery(transcript);
        // Tenta normalizar e navegar automaticamente
        const normalized = normalizeSearchToIcao(transcript);
        if (normalized) {
          navigate(`/airport/${normalized}`);
          setSearchQuery('');
        } else {
          // se não conseguiu normalizar, deixa o texto no input para edição
          // opcional: mostrar sugestão/erro visual
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
      // start pode lançar se já estiver ouvindo; ignora
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

  // interrompe reconhecimento ao desmontar
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
          <div className="flex items-center justify-between">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined">star</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/10 uppercase">
                  {AIRPORT_SBSP.icao} / {AIRPORT_SBSP.iata}
                </span>

                {/* Inline search form (same line do ICAO/IATA) */}
                <form onSubmit={handleSearchSubmit} className="ml-2 flex items-center gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="digite SBIH ou fale Sierra Bravo ..."
                    aria-label="Buscar aeroporto por código ou alfabeto fonético"
                    className="text-xs bg-white/5 placeholder-gray-400 text-white px-3 py-1.5 rounded-md border border-white/5 focus:outline-none focus:ring-1 focus:ring-primary w-[260px] transition-all"
                  />
                  <button
                    type="submit"
                    className="h-8 px-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all"
                  >
                    Ir
                  </button>

                  {/* Botão de microfone para reconhecimento de voz */}
                  <button
                    type="button"
                    aria-pressed={isListening}
                    onClick={() => (isListening ? stopListening() : startListening())}
                    title={isListening ? 'Parar escuta' : 'Falar (alfabeto fonético)'}
                    className={`flex items-center justify-center h-8 w-8 rounded-md border ${isListening ? 'bg-red-600 border-red-700' : 'bg-white/5 border-white/10'} text-white transition-all`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isListening ? 'mic' : 'mic_none'}
                    </span>
                  </button>
                </form>

                <span className="text-xs font-medium text-gray-300">• {AIRPORT_SBSP.distance}</span>
                <span className="text-xs font-medium text-gray-300 ml-auto flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">update</span> {AIRPORT_SBSP.lastUpdate}
                </span>
              </div>
              <h1 className="text-white text-3xl font-bold leading-tight tracking-tight drop-shadow-lg">
                {AIRPORT_SBSP.name}
              </h1>
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
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">Oficial</span>
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
                  onClick={(e) => { e.stopPropagation(); navigate('/notam/n1'); }}
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
            {TIMELINE_SBSP.map(item => (
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

        {/* Visual Feed Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-base font-bold">Feed Visual</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">Colaborativo</span>
            </div>
            <button
              onClick={() => setIsNewPostModalOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            </button>
          </div>

          {posts.map(post => (
            <article
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              className="bg-surface-dark rounded-xl overflow-hidden border border-white/5 shadow-lg active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="relative h-48 w-full bg-gray-800 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.content}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span> {post.timestamp}
                  </span>
                </div>
                {post.confidence === 'Alta Confiança' && (
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
                  <img src={post.authorAvatar} alt={post.author} className="h-8 w-8 rounded-full object-cover border-2 border-surface-dark-lighter" />
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
        <NewPostModal
          onClose={() => setIsNewPostModalOpen(false)}
          onAdd={handleAddPost}
        />
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

const StatItem: React.FC<{ icon: string, label: string, value: string, rotate?: string, color?: string }> = ({ icon, label, value, rotate = "", color = "text-gray-400" }) => (
  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 gap-1">
    <span className={`material-symbols-outlined ${color} text-[20px] ${rotate}`}>{icon}</span>
    <div className="text-center">
      <span className="block text-xs text-gray-400">{label}</span>
      <span className="block text-sm font-bold text-white">{value}</span>
    </div>
  </div>
);

export default AirportHome;
