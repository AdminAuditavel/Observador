//src/services/apiClient.ts

export async function getAerodromeSummary(icao = 'SBSP') {
  try {
    const r = await fetch(`/api/aerodrome/${icao}/summary`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('getAerodromeSummary failed, fallback to local mocks', e);
    return null;
  }
}

export async function getAerodromeFeed(icao = 'SBSP', limit = 10, offset = 0) {
  try {
    const r = await fetch(`/api/aerodrome/${icao}/feed?limit=${limit}&offset=${offset}`);
    if (!r.ok) throw new Error(`API ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('getAerodromeFeed failed, fallback to local mocks', e);
    return null;
  }
}

export async function postVisual(icao = 'SBSP', payload: any) {
  try {
    const r = await fetch(`/api/aerodrome/${icao}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('postVisual failed', e);
    throw e;
  }
}
