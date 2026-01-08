
export interface Airport {
  id: string;
  icao: string;
  iata: string;
  name: string;
  distance: string;
  lastUpdate: string;
  bgImage: string;
  metar: string;
  stats: {
    wind: string;
    visibility: string;
    ceiling: string;
    runway: string;
  };
  status: 'VFR' | 'IFR' | 'LIFR';
  weatherAnalysis?: string;
}

export interface Notam {
  id: string;
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  fullText: string;
  airport: string;
  startUtc: string;
  endUtc: string;
  mapImage?: string;
}

export interface VisualPost {
  id: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  content: string;
  imageUrl: string;
  timestamp: string;
  likes: number;
  confidence: 'Alta Confiança' | 'Média' | 'Baixa';
  aircraft?: string;
  location?: string;
  distance?: string;
}

export interface TimelineItem {
  id: string;
  time: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}
