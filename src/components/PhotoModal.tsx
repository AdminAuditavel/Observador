import React from 'react';
import ReactDOM from 'react-dom';

interface Props {
  photoUrl: string;
  onClose: () => void;
}

/**
 * Modal simples para visualizar a foto do colaborador.
 * Usa createPortal para montar no body (garante ficar sobre todo o app).
 */
const PhotoModal: React.FC<Props> = ({ photoUrl, onClose }) => {
  // Se document não existir (SSR) proteja:
  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* content */}
      <div className="relative z-10 max-w-xl w-full rounded-xl overflow-hidden bg-background-dark border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700"
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="w-full bg-black">
          <img
            src={photoUrl}
            alt="Foto do colaborador"
            className="w-full max-h-[80vh] object-contain bg-black"
            onClick={(e) => e.stopPropagation()} // evitar fechar ao clicar na foto
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PhotoModal;
