// Cotizador del portal: POST /api/cot (acciones en netlify/lib/cotizador-core.mjs) y GET /api/cot?img=<clave> (fotos subidas).
// "ver" y "evento" son públicas (las usa la página que ve el pasajero); el resto exige el login de la agencia.
import { getStore } from '@netlify/blobs';
import { verificarAgencia } from '../lib/portal-auth.mjs';
import { manejarCot, servirFoto } from '../lib/cotizador-core.mjs';

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const tienda = () => getStore({ name: 'cotizaciones', consistency: 'strong' });

export default async (req) => {
  const store = tienda();
  if (req.method === 'GET') {
    const f = await servirFoto(new URL(req.url).searchParams.get('img'), store);
    if (!f) return new Response('No encontrada', { status: 404 });
    return new Response(f.datos, { status: 200, headers: { 'content-type': f.tipo, 'cache-control': 'public, max-age=31536000, immutable' } });
  }
  if (req.method !== 'POST') return json(405, { error: 'metodo' });
  let body;
  try { body = await req.json(); } catch (e) { return json(400, { error: 'json' }); }
  const origen = process.env.URL || new URL(req.url).origin;
  const [status, out] = await manejarCot(body, { store, verificar: (slug, code) => verificarAgencia(slug, code, origen) });
  return json(status, out);
};

export const config = { path: '/api/cot' };
