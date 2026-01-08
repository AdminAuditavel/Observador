import type { VercelRequest, VercelResponse } from '@vercel/node';
import { POSTS_SBSP } from '../../../../services/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const icaoRaw = Array.isArray(req.query.icao) ? req.query.icao[0] : req.query.icao;
  const icao = String(icaoRaw || 'SBSP').toUpperCase();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body && Object.keys(req.body).length ? req.body : await parseJsonBody(req);

    if (!body || !body.author || !body.content) {
      return res.status(400).json({ error: 'author and content are required' });
    }

    const newPost = {
      id: `p_mock_${Date.now()}`,
      author: body.author,
      authorRole: body.authorRole || 'user',
      authorAvatar: body.authorAvatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(body.author)}`,
      content: body.content,
      imageUrl: body.imageUrl || null,
      timestamp: 'Agora',
      likes: 0,
      confidence: body.confidence || 'Desconhecida',
      location: body.location || `${icao} - mock location`
    };

    // in-memory push (lives per lambda instance)
    POSTS_SBSP.unshift(newPost);

    res.status(201).json({ created: newPost, source: 'mock' });
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) });
  }
}

function parseJsonBody(req: VercelRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
