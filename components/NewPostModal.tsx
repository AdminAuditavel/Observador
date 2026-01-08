//components/NewPostModal.tsx

import React, { useState } from 'react';
import { VisualPost } from '../types';

interface NewPostModalProps {
  onClose: () => void;
  onAdd: (post: VisualPost) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onAdd }) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !imageUrl) return;

    const newPost: VisualPost = {
      id: Date.now().toString(),
      author: 'Visitante',
      authorRole: 'Usuário App',
      authorAvatar: 'https://i.pravatar.cc/150?u=visitor',
      content,
      imageUrl,
      timestamp: 'Agora',
      likes: 0,
      confidence: 'Média'
    };

    onAdd(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-dark rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Novo Relato Visual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição do Avistamento</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ex: Nevoeiro na cabeceira 17..."
              className="bg-background-dark border-gray-700 rounded-lg text-white text-sm focus:ring-primary focus:border-primary h-24"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link Direto da Imagem (URL)</label>
            <input 
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              className="bg-background-dark border-gray-700 rounded-lg text-white text-sm focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-[10px] text-gray-500 mt-1 italic">Dica: Use links diretos do Unsplash, Imgur ou similares.</p>
          </div>

          <button 
            type="submit"
            className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-2"
          >
            Publicar Relato
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;
