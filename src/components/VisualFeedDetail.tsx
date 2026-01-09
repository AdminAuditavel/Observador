
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { POSTS_SBSP } from '../services/mockData';

const VisualFeedDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = POSTS_SBSP.find(p => p.id === id) || POSTS_SBSP[0];

  return (
    <div className="relative h-screen w-full flex flex-col bg-black overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        <img src={post.imageUrl} className="w-full h-full object-cover opacity-80" alt="Context" />
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
          <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide">Colaborativo</span>
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
            <img src={post.authorAvatar} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" alt={post.author} />
            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-[2px] border border-black">
              <span className="material-symbols-outlined text-[14px]">check</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg drop-shadow-md">{post.author}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm uppercase">Verified</span>
            </div>
            <div className="flex items-center text-white/80 text-sm gap-3 font-medium">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>{post.timestamp} atrás</span>
              </div>
              {post.distance && (
                <>
                  <div className="w-1 h-1 rounded-full bg-white/40"></div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">near_me</span>
                    <span>{post.distance}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {post.location && (
            <div className="flex items-start gap-2 text-white/90">
              <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
              <p className="font-semibold text-lg leading-tight">{post.location}</p>
            </div>
          )}
          <p className="text-white/80 text-base leading-relaxed pl-7 drop-shadow-sm">
            {post.content}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
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
