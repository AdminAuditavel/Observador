// services/mockData.ts

import { Airport, Notam, VisualPost, TimelineItem } from '../types';

export const AIRPORT_SBSP: Airport = {
  id: '1',
  icao: 'SBSP',
  iata: 'CGH',
  name: 'Aeroporto de Congonhas',
  distance: '12nm NE',
  lastUpdate: '2m',
  bgImage: 'https://source.unsplash.com/featured/1200x800?airport,aviation',
  metar: 'METAR SBSP 151400Z 14008KT 9999 SCT030 24/16 Q1018',
  status: 'VFR',
  stats: {
    wind: '140°/8',
    visibility: '10km+',
    ceiling: "3000'",
    runway: '17R'
  }
};

export const TIMELINE_SBSP: TimelineItem[] = [
  {
    id: 't1',
    time: '14:00',
    icon: 'check_circle',
    title: 'Pista Insp.',
    description: 'Inspeção rotina concluída',
    color: 'bg-green-500'
  },
  {
    id: 't2',
    time: '13:45',
    icon: 'air',
    title: 'Windshear',
    description: 'Reportado por B737 final 17R',
    color: 'bg-yellow-500'
  },
  {
    id: 't3',
    time: '13:30',
    icon: 'photo_camera',
    title: 'Foto Adic.',
    description: 'Novo registro visual',
    color: 'bg-blue-500'
  },
  {
    id: 't4',
    time: '12:50',
    icon: 'flight_takeoff',
    title: 'Ops. Normal',
    description: 'Tráfego intenso em decolagem',
    color: 'bg-green-500'
  }
];

export const POSTS_SBSP: VisualPost[] = [
  {
    id: 'p1',
    author: 'Cmdt. Silva',
    authorRole: 'Embraer E195',
    authorAvatar: 'https://i.pravatar.cc/150?u=silva',
    content:
      'Final 17R. Chuva moderada no setor leste. Visibilidade reduzida na curta final.',
    imageUrl:
      'https://source.unsplash.com/featured/1200x1600?runway,airport,rain',
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
    content:
      'Pátio geral molhado, mas sem acúmulo de água. Operações normais.',
    imageUrl:
      'https://source.unsplash.com/featured/1200x1600?apron,airport,ground-operations',
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
    description:
      'A Pista 11L/29R estará fechada devido a manutenção programada. Todos os pilotos devem planejar aproximações para a pista paralela 11R/29L.',
    fullText:
      'A0421/24 NOTAMN\nQ) SBSP/QMRLC/IV/NBO/A/000/999\nA) SBSP B) 2410241000 C) 2410251400\nE) RWY 11L/29R CLSD DUE TO MAINT\nCREATED: 23 OCT 18:45 2024\nSOURCE: SBSPYNYX',
    airport: 'SBSP - Congonhas',
    startUtc: '24 OUT 10:00',
    endUtc: '25 OUT 14:00',
    mapImage:
      'https://source.unsplash.com/featured/1200x800?airport,runway,map'
  }
];
