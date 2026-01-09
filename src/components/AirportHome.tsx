//src/components/AirportHome.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIRPORT_SBSP, TIMELINE_SBSP, POSTS_SBSP } from '../services/mockData';
import { VisualPost } from '../types';
import NewPostModal from './NewPostModal';
import PhotoModal from './PhotoModal';

interface AirportHomeProps {
  onOpenWeather: () => void;
}

const AirportHome: React.FC<AirportHomeProps> = ({ onOpenWeather }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<VisualPost[]>(POSTS_SBSP);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [photoUrlOpen, setPhotoUrlOpen] = useState<string | null>(null);

  const handleAddPost = (newPost: VisualPost) => {
    setPosts([newPost, ...posts]);
  };

  const openAuthorPhoto = (e: React.MouseEvent | React.KeyboardEvent, url: string) => {
    console.log('openAuthorPhoto called for', url, 'event:', e.type);
    if ('stopPropagation' in e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setPhotoUrlOpen(url);
  };

  return (
    <div className="flex flex-col pb-20">
      {/* ... header and other sections unchanged (omitted for brevity) ... */}
      <main className="flex flex-col gap-6 -mt-4 relative z-10 px-4">
        {/* (Resumo Oficial, Timeline omitted for brevity in this debug file) */}

        {/* Visual Feed Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-base font-bold">Feed Visual</h3>
            </div>
            <button
              onClick={() => setIsNewPostModalOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white"
              aria-label="Novo post"
            >
              <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            </button>
          </div>

          {posts.map(post => (
            <article
              key={post.id}
              onClick={(e) => {
                console.log('article onClick for', post.id, 'target=', (e.target as HTMLElement).tagName);
                const target = e.target as HTMLElement | null;
                if (target && target.closest('[data-no-nav]')) {
                  console.log('article: click originated from data-no-nav, skipping navigate');
                  return;
                }
                navigate(`/post/${post.id}`);
              }}
              className="bg-surface-dark rounded-xl overflow-hidden border border-white/5 shadow-lg transition-all cursor-pointer group mb-4"
            >
              <div className="relative h-48 w-full bg-gray-800 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.content}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute bottom-0 left-0 w-full p-4">
                  <p className="text-white font-medium text-sm leading-tight">{post.content}</p>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    data-no-nav="true"
                    className="h-8 w-8 rounded-full object-cover border-2 border-surface-dark-lighter cursor-pointer"
                    onClickCapture={(e) => {
                      console.log('avatar onClickCapture for', post.id, 'evt=', e.type);
                      e.stopPropagation();
                      openAuthorPhoto(e, post.authorAvatar);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        (e as React.KeyboardEvent).stopPropagation();
                        openAuthorPhoto(e, post.authorAvatar);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Abrir foto de ${post.author}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{post.author}</span>
                    <span className="text-[10px] text-gray-400">{post.authorRole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors no-nav" aria-label="Curtir">
                    <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                    <span className="text-xs font-medium">{post.likes}</span>
                  </button>
                  <button className="text-gray-400 no-nav" aria-label="Denunciar">
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

      {photoUrlOpen && (
        <PhotoModal photoUrl={photoUrlOpen} onClose={() => setPhotoUrlOpen(null)} />
      )}

      {/* footer omitted for brevity */}
    </div>
  );
};

export default AirportHome;
