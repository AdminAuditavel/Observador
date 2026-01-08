//components/WeatherModal.tsx

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AIRPORT_SBSP } from '../services/mockData';

interface WeatherModalProps {
  onClose: () => void;
}

const WeatherModal: React.FC<WeatherModalProps> = ({ onClose }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const decodeWithAI = async () => {
    setIsLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise este METAR/TAF aeronáutico para o aeroporto SBSP e explique em português simples para um piloto, destacando riscos se houver: ${AIRPORT_SBSP.metar}`,
        config: {
          systemInstruction: "Você é um especialista em meteorologia aeronáutica brasileira (REDEMET). Traduza códigos técnicos para linguagem clara e direta."
        }
      });
      setAiAnalysis(response.text || "Não foi possível analisar no momento.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Erro ao conectar com o serviço de IA. Verifique sua conexão.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      ></div>
      
      <div className="relative flex w-full flex-col overflow-hidden rounded-t-2xl bg-background-dark shadow-2xl h-[90vh] animate-in slide-in-from-bottom-full duration-300 border-t border-white/10">
        <div className="flex w-full items-center justify-center pt-3 pb-1 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-slate-700"></div>
        </div>

        <div className="flex items-center justify-between px-5 pb-4 pt-2 border-b border-slate-800 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-white text-xl font-bold tracking-tight">SBSP</h2>
            <p className="text-slate-400 text-sm font-medium">Aeroporto de Congonhas</p>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-12 no-scrollbar">
          {/* METAR Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">METAR</h3>
              <div className="flex gap-2">
                <div className="flex h-7 items-center justify-center rounded-md bg-emerald-400/10 px-3 border border-emerald-400/20">
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">VFR</span>
                </div>
                <div className="flex h-7 items-center justify-center rounded-md bg-slate-800 px-3">
                  <span className="material-symbols-outlined mr-1 text-slate-400 text-[14px]">schedule</span>
                  <p className="text-slate-400 text-xs font-medium">10m atrás</p>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-800 bg-surface-dark p-4 shadow-sm mb-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 overflow-x-auto no-scrollbar">
                    <p className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Código Raw</p>
                    <p className="font-mono text-slate-200 text-sm whitespace-nowrap">
                      {AIRPORT_SBSP.metar}
                    </p>
                  </div>
                  <button className="flex shrink-0 items-center justify-center rounded-lg h-8 w-8 bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>

                <button 
                  onClick={decodeWithAI}
                  disabled={isLoadingAi}
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-lg shadow-purple-900/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px] animate-pulse">auto_awesome</span>
                  {isLoadingAi ? 'Analisando...' : 'Decodificar com IA'}
                </button>

                {aiAnalysis && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs text-purple-200 leading-relaxed italic">
                      {aiAnalysis}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <WeatherGridItem icon="air" label="Vento" value="140° a 08kt" />
              <WeatherGridItem icon="visibility" label="Visibilidade" value="≥ 10 km" />
              <WeatherGridItem icon="cloud" label="Nuvens" value="SCT @ 3000ft" />
              <WeatherGridItem icon="thermostat" label="Temp" value="24°C" extra="(Dew 16°)" />
              <WeatherGridItem icon="compress" label="Pressão (QNH)" value="1018 hPa" full />
            </div>
          </div>

          {/* TAF Section */}
          <div className="mb-8">
            <h3 className="text-white text-lg font-bold mb-4">Previsão (TAF)</h3>
            <div className="relative rounded-xl border border-slate-800 bg-surface-dark p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Código Raw</p>
                  <button className="text-primary text-xs font-medium">Copiar</button>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <p className="font-mono text-slate-300 text-sm leading-relaxed">
                    TAF SBSP 151000Z 1512/1612 14008KT 9999 SCT030 TX26/1518Z TN18/1609Z<br/>
                    BECMG 1514/1516 16010KT<br/>
                    PROB30 1602/1606 RA
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-3 px-1">
              <div className="w-1 rounded-full bg-primary/30"></div>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                Mudança gradual entre 14h e 16h para ventos de 160° a 10kt. Probabilidade de chuva leve na madrugada.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <a href="https://redemet.decea.mil.br/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-transparent py-2 px-4 hover:bg-slate-800 transition-colors">
              <span className="text-xs font-semibold text-slate-400">Fonte Oficial: REDEMET</span>
              <span className="material-symbols-outlined text-slate-400 text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherGridItem: React.FC<{ icon: string, label: string, value: string, extra?: string, full?: boolean }> = ({ icon, label, value, extra, full }) => (
  <div className={`flex flex-col gap-1 rounded-xl bg-surface-dark p-3 border border-slate-800 ${full ? 'col-span-2' : ''}`}>
    <div className="flex items-center gap-2 mb-1">
      <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <p className="text-white text-base font-semibold">{value}</p>
      {extra && <span className="text-[10px] text-slate-500">{extra}</span>}
    </div>
  </div>
);

export default WeatherModal;
