// Buscador de fotos de Unsplash para las herramientas del portal (Generador de flyers y, más adelante, cotizaciones).
// POST /api/fotos con { slug, code, accion }:
//   estado → { configurado } (si hay clave de Unsplash cargada)
//   buscar → { q, pagina, orientacion } → { fotos: [...], total, paginas }
//   usar   → { id } avisa a Unsplash que la foto se usó (lo exigen sus reglas de la API: "trigger a download").
// La clave (UNSPLASH_ACCESS_KEY) queda solo en el servidor. Las fotos se muestran desde las direcciones de Unsplash
// (hotlinking, otra regla de la API) y cada una trae el crédito del fotógrafo para mostrarlo en el portal.
import { verificarAgencia } from '../lib/portal-auth.mjs';

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const API = 'https://api.unsplash.com';
const UTM = 'utm_source=portal_kickstart&utm_medium=referral';
const conUtm = u => u ? u + (u.includes('?') ? '&' : '?') + UTM : '';

export function armarFoto(p) {
  const raw = p.urls && p.urls.raw;
  return {
    id: p.id,
    miniatura: p.urls && p.urls.small,
    grande: raw ? raw + (raw.includes('?') ? '&' : '?') + 'w=2160&q=85&fm=jpg&fit=max' : (p.urls && p.urls.full),
    ancho: p.width, alto: p.height,
    color: p.color || '#cccccc',
    descripcion: p.alt_description || p.description || '',
    autor: (p.user && p.user.name) || 'Fotógrafo de Unsplash',
    autorUrl: conUtm(p.user && p.user.links && p.user.links.html),
    fotoUrl: conUtm(p.links && p.links.html),
    unsplashUrl: 'https://unsplash.com/?' + UTM,
  };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'metodo' });
  let body;
  try { body = await req.json(); } catch (e) { return json(400, { error: 'json' }); }
  const origen = process.env.URL || new URL(req.url).origin;
  const datos = await verificarAgencia(body.slug, body.code, origen);
  if (!datos) return json(401, { error: 'sesion' });

  const clave = process.env.UNSPLASH_ACCESS_KEY;
  if (body.accion === 'estado') return json(200, { configurado: !!clave });
  if (!clave) return json(503, { error: 'sin_configurar' });
  const headers = { Authorization: 'Client-ID ' + clave, 'Accept-Version': 'v1' };

  if (body.accion === 'buscar') {
    const q = String(body.q || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!q) return json(400, { error: 'busqueda' });
    const pagina = Math.min(Math.max(parseInt(body.pagina, 10) || 1, 1), 20);
    const orient = ['portrait', 'landscape', 'squarish'].includes(body.orientacion) ? body.orientacion : '';
    const url = `${API}/search/photos?query=${encodeURIComponent(q)}&page=${pagina}&per_page=12&content_filter=high` + (orient ? `&orientation=${orient}` : '');
    try {
      const r = await fetch(url, { headers });
      if (r.status === 403 || r.status === 429) return json(429, { error: 'limite' });
      if (!r.ok) { console.error('Unsplash buscar:', r.status, await r.text().catch(() => '')); return json(502, { error: 'unsplash' }); }
      const out = await r.json();
      return json(200, { fotos: (out.results || []).map(armarFoto), total: out.total || 0, paginas: out.total_pages || 0 });
    } catch (e) { console.error('Unsplash buscar:', e.message); return json(502, { error: 'unsplash' }); }
  }

  if (body.accion === 'usar') {
    const id = String(body.id || '');
    if (!/^[A-Za-z0-9_-]{5,40}$/.test(id)) return json(400, { error: 'id' });
    try {
      const r = await fetch(`${API}/photos/${id}/download`, { headers });
      if (!r.ok) console.error('Unsplash usar:', r.status);
    } catch (e) { console.error('Unsplash usar:', e.message); }
    return json(200, { ok: true });   // si el aviso falla no frenamos al agente
  }

  return json(400, { error: 'accion' });
};

export const config = { path: '/api/fotos' };
