//src/components/AirportHome.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIRPORT_SBSP as LOCAL_AIRPORT, TIMELINE_SBSP, POSTS_SBSP } from '../services/mockData';
import { VisualPost } from '../types';
import NewPostModal from './NewPostModal';
import { getAerodromeSummary, getAerodromeFeed } from '../services/apiClient';
import Button from './Button';
import Card from './Card';

interface AirportHomeProps {
  onOpenWeather: () => void;
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=800';

const AirportHome: React.FC<AirportHomeProps> = ({ onOpenWeather }) => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<VisualPost[]>(POSTS_SBSP);
  const [airportSummary, setAirportSummary] = useState<any>(null);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

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
      {/* Header / Hero */}
      <header className="hero-header" aria-labelledby="airport-title">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url(${LOCAL_AIRPORT.bgImage})` }}
          role="img"
          aria-label={`${LOCAL_AIRPORT.name} background`}
        >
          <div className="hero-overlay" />
        </div>

        <div className="hero-content container">
          <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
            <button aria-label="Abrir menu" className="icon-btn" title="Menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button aria-label="Favoritos" className="icon-btn" title="Favoritos">
                <span className="material-symbols-outlined">star</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 'auto', width: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="note" style={{ background: 'rgba(255,255,255,0.18)', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>
                  {LOCAL_AIRPORT.icao} / {LOCAL_AIRPORT.iata}
                </span>
                <span className="note muted">• {LOCAL_AIRPORT.distance}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.9)' }} aria-hidden>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>update</span> {LOCAL_AIRPORT.lastUpdate}
                </span>
              </div>

              <h1 id="airport-title" style={{ color: 'white', fontSize: 32, margin: 0, fontWeight: 800, textShadow: '0 4px 18px rgba(0,0,0,0.5)' }}>
                {LOCAL_AIRPORT.name}
              </h1>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button
                variant="primary"
                onClick={() => { /* open map/route */ }}
                className="btn-map"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>map</span>
                <span>Ver mapa / rota</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" role="main" style={{ marginTop: -32 }}>
        {/* Official Summary Card */}
        <section
          onClick={onOpenWeather}
          className="card"
          aria-label="Resumo oficial do aeroporto"
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(15,23,36,0.04)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>Resumo Oficial</h2>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: 'rgba(31,111,235,0.08)', color: 'var(--primary)' }}>Oficial</span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--success)', display: 'inline-block' }} aria-hidden />
                <span style={{ fontSize: 12, color: 'var(--success)' }}>{LOCAL_AIRPORT.status}</span>
              </span>
            </div>
          </div>

          <div style={{ paddingTop: 12 }}>
            <pre style={{ background: '#0f172433', padding: 12, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#e6eef7', overflowX: 'auto' }}>
              {airport.metar}
            </pre>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
              <StatItem icon="navigation" label="Vento" value={airport.stats.wind} rotate="rotate-45" />
              <StatItem icon="visibility" label="Visib." value={airport.stats.visibility} />
              <StatItem icon="cloud" label="Teto" value={airport.stats.ceiling} />
              <StatItem icon="flight_takeoff" label="Pista" value={airport.stats.runway} />
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>NOTAMs Críticos</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); navigate('/notam/n1'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', cursor: 'pointer' }}
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
                  <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: 16 }}>warning</span>
                  <div style={{ fontSize: 12, color: 'rgb(145, 126, 24)', fontWeight: 600 }}>Obras na TWY Charlie</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Linha do Tempo</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/timeline')}>Ver tudo</button>
          </div>

          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {TIMELINE_SBSP.map(item => (
              <div key={item.id} className="timeline-card">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{item.time}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{item.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Feed */}
        <section style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Feed Visual</h3>
              <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: 'rgba(139, 92, 246, 0.06)', color: '#7c3aed', fontWeight: 700 }}>Colaborativo</span>
            </div>
            <button aria-label="Adicionar foto" onClick={handleOpenModal} className="icon-btn" title="Adicionar foto">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_a_photo</span>
            </button>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {posts.map(post => (
              <article
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                onKeyDown={(e) => onArticleKeyDown(e, post.id)}
                role="button"
                tabIndex={0}
                className="feed-card"
                aria-label={`Post de ${post.author} — ${post.content}`}
              >
                <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: 12 }}>
                  <img
                    src={post.imageUrl || PLACEHOLDER_IMG}
                    alt={post.content || 'Imagem do post'}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent 40%)' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <div style={{ fontSize: 11, background: 'rgba(0,0,0,0.5)', padding: '6px 8px', borderRadius: 8, color: '#fff', fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, marginRight: 6 }}>schedule</span>{post.timestamp}
                    </div>
                  </div>
                  {post.confidence === 'Alta Confiança' && (
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <div style={{ fontSize: 11, background: 'var(--success)', padding: '6px 8px', borderRadius: 8, color: '#fff', fontWeight: 700 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, marginRight: 6 }}>verified</span>{post.confidence}
                      </div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
                    <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: 14, lineHeight: 1.15 }}>{post.content}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={post.authorAvatar || PLACEHOLDER_IMG} alt={`${post.author} avatar`} style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover', border: '2px solid rgba(0,0,0,0.04)' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{post.author}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{post.authorRole}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button aria-label={`Curtir post ${post.id}`} onClick={(e) => { e.stopPropagation(); }} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--muted)', background: 'transparent', border: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span>
                      <span style={{ fontSize: 12 }}>{post.likes}</span>
                    </button>

                    <button aria-label={`Denunciar post ${post.id}`} onClick={(e) => { e.stopPropagation(); }} style={{ color: 'var(--muted)', background: 'transparent', border: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {isNewPostModalOpen && (
        <NewPostModal
          onClose={handleCloseModal}
          onAdd={handleAddPost}
        />
      )}

      {/* Footer */}
      <footer className="app-footer" role="contentinfo" style={{ marginTop: 24 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: 16 }}>warning</span>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Informação complementar. Não substitui briefings oficiais. O piloto em comando é a autoridade final.
          </p>
        </div>
      </footer>
    </div>
  );
};

const StatItemInner: React.FC<{ icon: string, label: string, value: string, rotate?: string, color?: string }> = ({ icon, label, value, rotate = "", color = "" }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, background: 'rgba(15,23,36,0.02)', gap: 8 }}>
    <span className="material-symbols-outlined" style={{ color: color || 'var(--muted)', fontSize: 20 }}>{icon}</span>
    <div style={{ textAlign: 'center' }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{label}</span>
      <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  </div>
);

const StatItem = React.memo(StatItemInner);

export default AirportHome;
