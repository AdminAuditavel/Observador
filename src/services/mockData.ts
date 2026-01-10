//src/services/mockData.ts


import { Airport, Notam, VisualPost, TimelineItem } from '../types';

export const AIRPORT_SBSP: Airport = {
  id: '1',
  icao: 'SBSP',
  iata: 'CGH',
  name: 'Aeroporto de Congonhas',
  distance: '12nm NE',
  lastUpdate: '2m',
  bgImage: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=1200',
  metar: 'METAR SBSP 101000Z 04002KT 1800 -RA BR SCT002 BKN004 OVC050 24/24 Q1013',
  status: 'IFR',
  stats: {
    wind: '140°/8',
    visibility: '10km+',
    ceiling: "3000'",
    runway: '17R'
  }
};

export const TIMELINE_SBSP: TimelineItem[] = [
  { id: 't1', time: '14:00', icon: 'check_circle', title: 'Pista Insp.', description: 'Inspeção rotina concluída', color: 'bg-green-500' },
  { id: 't2', time: '13:45', icon: 'air', title: 'Windshear', description: 'Reportado por B737 final 17R', color: 'bg-yellow-500' },
  { id: 't3', time: '13:30', icon: 'photo_camera', title: 'Foto Adic.', description: 'Novo registro visual', color: 'bg-blue-500' },
  { id: 't4', time: '12:50', icon: 'flight_takeoff', title: 'Ops. Normal', description: 'Tráfego intenso em decolagem', color: 'bg-green-500' }
];

export const POSTS_SBSP: VisualPost[] = [
  {
    id: 'p1',
    author: 'Cmdt. Silva',
    authorRole: 'Embraer E195',
    authorAvatar: "https://i.pravatar.cc/150?u=capt-silva",
    content: 'Final 17R. Chuva moderada no setor leste. Visibilidade reduzida na curta final.',
    imageUrl: 'https://images.unsplash.com/photo-1506012733851-bb0755ec04a0?auto=format&fit=crop&q=80&w=800',
    timestamp: '10 min',
    likes: 12,
    confidence: 'Alta Confiança',
    location: 'SBSP - Congonhas, Final Rwy 17R',
    distance: '5 NM'
  },
  {
    id: 'p2',
    author: 'João Paulo',
    authorRole: 'Ground Ops',
    authorAvatar: 'https://i.pravatar.cc/150?u=joao',
    content: 'Pátio geral molhado, mas sem acúmulo de água. Operações normais.',
    imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=800',
    timestamp: '25 min',
    likes: 4,
    confidence: 'Alta Confiança'
  }
];

export const NOTAMS_SBSP: Notam[] = [
  {
    id: 'n1',
    code: 'A0421/24',
    severity: 'critical',
    title: 'CRÍTICO • PISTA FECHADA',
    description: 'A Pista 11L/29R estará fechada devido a manutenção programada. Todos os pilotos devem planejar aproximações para a pista paralela 11R/29L.',
    fullText: 'A0421/24 NOTAMN\nQ) SBBS/QMRLC/IV/NBO/A/000/999\nA) SBBR B) 2410241000 C) 2410251400\nE) RWY 11L/29R CLSD DUE TO MAINT\nCREATED: 23 OCT 18:45 2024\nSOURCE: SBBRYNYX',
    airport: 'SBBR - Brasília Intl',
    startUtc: '24 OUT 10:00',
    endUtc: '25 OUT 14:00',
    mapImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=800'
  }
];
