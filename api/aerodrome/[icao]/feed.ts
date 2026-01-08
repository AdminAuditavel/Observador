import type { VercelRequest, VercelResponse } from '@vercel/node';
import { POSTS_SBSP } from '../../../../services/mockData';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const icaoRaw = Array.isArray(req.query.icao) ? req.query.icao[0] : req.query.icao;
  const limit = Number(req.query.limit || 10);
  const offset = Number(req.query.offset || 0);

  const items = POSTS_SBSP.slice(offset, offset + limit).map(p => ({ ...p }));

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
  res.status(200).json({
    type: 'feed',
    icao: String(icaoRaw || 'SBSP').toUpperCase(),
    limit,
    offset,
    items,
    fetched_at: new Date().toISOString(),
    source: 'mock'
  });
}
