// api/aerodrome/[icao]/summary.ts
import { AIRPORT_SBSP, POSTS_SBSP, NOTAMS_SBSP } from '../../../services/mockData';

export default function handler(req: any, res: any) {
  const icaoRaw = Array.isArray(req.query?.icao) ? req.query.icao[0] : req.query?.icao;
  const icao = String((icaoRaw || 'SBSP')).toUpperCase();

  const airport = icao === 'SBSP' ? AIRPORT_SBSP : { ...AIRPORT_SBSP, icao };

  const summary = {
    type: 'summary',
    icao: airport.icao,
    metar: airport.metar,
    stats: airport.stats,
    notams: NOTAMS_SBSP.slice(0, 5).map(n => ({ ...n })),
    latestPhoto: POSTS_SBSP.length ? { ...POSTS_SBSP[0] } : null,
    fetched_at: new Date().toISOString(),
    source: 'mock'
  };

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  res.status(200).json(summary);
}
