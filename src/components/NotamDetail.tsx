//src/components/NotamDetail.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NOTAMS_SBSP } from '../services/mockData';

const NotamDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notam = NOTAMS_SBSP.find(n => n.id === id) || NOTAMS_SBSP[0];

  return (
    <div className="flex flex-col min-h-screen bg-background-dark max-w-md mx-auto shadow-2xl relative">
      <header className="flex items-center px-4 py-3 justify-between bg-background-dark sticky top-0 z-50 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors size-10 flex items-center justify-center rounded-full hover:bg-white/5">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Detalhes do NOTAM</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-5 shadow-lg shadow-red-900/20">
          <div className="absolute -right-4 -top-4 text-white/10 rotate-12 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] fill-current">warning</span>
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center size-6 rounded-full bg-white/20">
                <span className="material-symbols-outlined text-white text-[16px]">priority_high</span>
              </span>
              <span className="text-white/90 text-xs font-bold uppercase tracking-wider">{notam.title}</span>
            </div>
            <h1 className="text-white text-3xl font-bold tracking-tight">{notam.code}</h1>
            <p className="text-white/80 text-sm font-medium mt-1">Série A • Internacional</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#1a2230] p-4 rounded-xl border border-gray-800 shadow-sm">
          <div className="bg-gray-700 rounded-full h-12 w-12 shrink-0 border border-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400">local_airport</span>
          </div>
          <div className="flex flex-col justify-center flex-1">
            <p className="text-white text-base font-semibold">{notam.airport}</p>
            <p className="text-gray-400 text-xs font-normal">Q-Code: QMRLC</p>
          </div>
          <span className="material-symbols-outlined text-primary">verified</span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-gray-800 rounded-xl overflow-hidden border border-gray-800">
          <div className="bg-[#1a2230] p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
              <p className="text-gray-400 text-xs font-medium uppercase">Início (UTC)</p>
            </div>
            <p className="text-white text-sm font-bold">{notam.startUtc}</p>
          </div>
          <div className="bg-[#1a2230] p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-gray-500 text-[18px]">event_busy</span>
              <p className="text-gray-400 text-xs font-medium uppercase">Fim (UTC)</p>
            </div>
            <p className="text-white text-sm font-bold">{notam.endUtc}</p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex gap-3 items-start">
          <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">translate</span>
          <div className="flex flex-col gap-1">
            <h3 className="text-primary font-semibold text-sm">Resumo Decodificado</h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              {notam.description}
            </p>
          </div>
        </div>

        {notam.mapImage && (
          <div className="space-y-3">
            <h3 className="text-white text-base font-bold px-1">Evidência Visual / Mapa</h3>
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
              <img src={notam.mapImage} className="w-full h-full object-cover opacity-60" alt="NOTAM Map" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">RWY 11L/29R</span>
                <span className="bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded border border-white/10">Manutenção</span>
              </div>
              <button className="absolute top-3 right-3 size-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-white text-base font-bold">Texto Original (Raw)</h3>
            <button className="text-primary text-xs font-medium">Copiar</button>
          </div>
          <div className="bg-[#0c1018] border border-gray-800 rounded-xl p-4 font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
            {notam.fullText}
          </div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 w-full bg-background-dark/95 backdrop-blur-xl border-t border-gray-800 p-4 pb-8 z-50">
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-semibold h-12 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Marcar como lido
          </button>
          <button className="size-12 flex items-center justify-center bg-gray-800 text-white rounded-xl">
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotamDetail;
