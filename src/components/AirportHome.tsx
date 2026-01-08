//src/components/AirportHome.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIRPORT_SBSP as LOCAL_AIRPORT, TIMELINE_SBSP, POSTS_SBSP } from '../services/mockData';
import { VisualPost } from '../types';
import NewPostModal from './NewPostModal';
import { getAerodromeSummary, getAerodromeFeed } from '../services/apiClient';

interface AirportHomeProps {
  onOpenWeather: () => void;
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=800';

const AirportHome: React.FC<AirportHomeProps> = ({ onOpenWeather }) => {
  const navigate = useNavigate();

  // keep a local fallback but prefer API data when available
  const [posts, setPosts] = useState<VisualPost[]>(POSTS_SBSP);
  const [airportSummary, setAirportSummary] = useState<any>(null);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

  // use functional updates to avoid stale state
  const handleAddPost = useCallback((newPost: VisualPost) => {
    setPosts(prev => [newPost, ...prev]);
    setIsNewPostModalOpen(false);
  }, []);

  const handleOpenModal = useCallback(() => setIsNewPostModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsNewPostModalOpen(false), []);

  const onArticleKeyDown = useCallback((e: React.KeyboardEvent, postId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/post/${postId}`);
    }
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const summary = await getAerodromeSummary('SBSP');
        if (mounted && summary) {
          setAirportSummary(summary);
        } else {
          setAirportSummary({ metar: LOCAL_AIRPORT.metar, stats: LOCAL_AIRPORT.stats });
        }
      } catch (e) {
        setAirportSummary({ metar: LOCAL_AIRPORT.metar, stats: LOCAL_AIRPORT.stats });
      }

      try {
        const feed = await getAerodromeFeed('SBSP', 20, 0);
        if (mounted && feed && Array.isArray(feed.items)) {
          setPosts(feed.items);
        } else {
          setPosts(POSTS_SBSP);
        }
      } catch (e) {
        setPosts(POSTS_SBSP);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const airport = airportSummary ? { ...LOCAL_AIRPORT, ...airportSummary } : LOCAL_AIRPORT;

  return (
    <div className="flex flex-col pb-20">
      {/* Header with Background */}
      <header className="relative w-full h-[320px] shrink-0" aria-labelledby="airport-title">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${LOCAL_AIRPORT.bgImage})` }}
          role="img"
          aria-label={`${LOCAL_AIRPORT.name} background`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#111722]"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between p-4 pb-6">
          <div className="flex items-center justify-between">
            <button aria-label="Abrir menu" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button aria-label="Favoritos" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10">
              <span className="material-symbols-outlined">star</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/10 uppercase">
                  {LOCAL_AIRPORT.icao} / {LOCAL_AIRPORT.iata}
                </span>
                <span className="text-xs font-medium text-gray-300">• {LOCAL_AIRPORT.distance}</span>
                <span className="text-xs font-medium text-gray-300 ml-auto flex items-center gap-1" aria-hidden>
                  <span className="material-symbols-outlined text-[14px]">update</span> {LOCAL_AIRPORT.lastUpdate}
                </span>
              </div>
              <h1 id="airport-title" className="text-white text-3xl font-bold leading-tight tracking-tight drop-shadow-lg">
                {LOCAL_AIRPORT.name}
              </h1>
            </div>
            <button
              aria-label="Ver mapa e rota"
              className="flex w-full items-center justify-center h-11 bg-primary hover:bg-blue-600 active:bg-blue-700 transition-colors rounded-lg text-white gap-2 px-4 text-sm font-bold shadow-lg shadow-blue-900/20"
            >
              <span className="material-symbols-outlined text-[20px]">map</span>
              <span>Ver mapa / rota</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col gap-6 -mt-4 relative z-10 px-4" role="main">
        {/* Official Summary Card */}
        <section
          onClick={onOpenWeather}
          className="bg-surface-dark rounded-xl border border-white/5 shadow-xl overflow-hidden cursor-pointer hover:bg-surface-dark-lighter transition-colors"
          aria-label="Resumo oficial do aeroporto"
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
              <span className="text-xs font-medium text-green-400">{LOCAL_AIRPORT.status}</span>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="bg-[#111722] p-3 rounded-lg border-l-4 border-green-500 font-mono text-xs leading-relaxed text-gray-300">
              {airport.metar}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <StatItem icon="navigation" label="Vento" value={airport.stats.wind} rotate="rotate-45" />
              <StatItem icon="visibility" label="Visib." value={airport.stats.visibility} />
              <StatItem icon="cloud" label="Teto" value={airport.stats.ceiling} />
              <StatItem icon="flight_takeoff" label="Pista" value={airport.stats.runway} color="text-green-500" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">NOTAMs Críticos</span>
              <div className="flex flex-wrap gap-2">
                <div
                  onClick={(e) => { e.stopPropagation(); navigate('/notam/n1'); }}
                  className="flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 pl-2 pr-3 py-1 cursor-pointer hover:bg-yellow-500/20"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/notam/n1');
                    }
                  }}
                  aria-label="Abrir NOTAM crítico"
                >
                  <span className="material-symbols-outlined text-yellow-500 text-[16px]">warning</span>
                  <p className="text-yellow-200 text-xs font-medium">Obras na TWY Charlie</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="flex flex-col gap-3" aria-label="Linha do tempo">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-white text-base font-bold">Linha do Tempo</h3>
            <span className="text-xs text-primary font-medium cursor-pointer">Ver tudo</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x" aria-hidden={false}>
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
        <section className="flex flex-col gap-4" aria-label="Feed visual colaborativo">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-base font-bold">Feed Visual</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">Colaborativo</span>
            </div>
            <button
              onClick={handleOpenModal}
              aria-label="Adicionar foto"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            </button>
          </div>

          {posts.map(post => (
            <article
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              onKeyDown={(e) => onArticleKeyDown(e, post.id)}
              role="button"
              tabIndex={0}
              className="bg-surface-dark rounded-xl overflow-hidden border border-white/5 shadow-lg active:scale-[0.99] transition-all cursor-pointer group"
              aria-label={`Post de ${post.author} — ${post.content}`}
            >
              <div className="relative h-48 w-full bg-gray-800 overflow-hidden">
                <img
                  src={post.imageUrl || PLACEHOLDER_IMG}
                  alt={post.content || 'Imagem do post'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
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
                  <img src={post.authorAvatar || PLACEHOLDER_IMG} alt={`${post.author} avatar`} className="h-8 w-8 rounded-full object-cover border-2 border-surface-dark-lighter" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{post.author}</span>
                    <span className="text-[10px] text-gray-400">{post.authorRole}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    aria-label={`Curtir post ${post.id}`}
                    onClick={(e) => { e.stopPropagation(); /* implementar like */ }}
                    className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                    <span className="text-xs font-medium">{post.likes}</span>
                  </button>
                  <button
                    aria-label={`Denunciar post ${post.id}`}
                    onClick={(e) => { e.stopPropagation(); /* abrir modal de report */ }}
                    className="text-gray-400"
                  >
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
          onClose={handleCloseModal}
          onAdd={handleAddPost}
        />
      )}

      {/* Footer Disclaimer */}
      <footer className="fixed bottom-0 w-full z-50 bg-[#111722]/90 backdrop-blur-lg border-t border-white/5 py-2 px-4" role="contentinfo">
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

const StatItemInner: React.FC<{ icon: string, label: string, value: string, rotate?: string, color?: string }> = ({ icon, label, value, rotate = "", color = "text-gray-400" }) => (
  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 gap-1">
    <span className={`material-symbols-outlined ${color} text-[20px] ${rotate}`}>{icon}</span>
    <div className="text-center">
      <span className="block text-xs text-gray-400">{label}</span>
      <span className="block text-sm font-bold text-white">{value}</span>
    </div>
  </div>
);

const StatItem = React.memo(StatItemInner);

export default AirportHome;
