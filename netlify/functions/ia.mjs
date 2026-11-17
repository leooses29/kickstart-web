// Generador de Guiones del portal de agencias: POST /api/ia
// Acciones: estado (créditos e historial), generar (nuevo guion o ajuste), voto (👍/👎 y comentario),
// flyer (ordena la información de un paquete —texto, imagen o PDF— para el Generador de flyers; usa 1 crédito).
import { getStore } from '@netlify/blobs';
import { verificarAgencia } from '../lib/portal-auth.mjs';
import { manejar, llamarClaude } from '../lib/ia-core.mjs';

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'metodo' });
  let body;
  try { body = await req.json(); } catch (e) { return json(400, { error: 'json' }); }
  const env = { CREDITOS_MES: process.env.CREDITOS_MES, ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5' };
  if (['generar', 'flyer', 'encuadre'].includes(body.accion) && !process.env.ANTHROPIC_API_KEY) return json(503, { error: 'sin_configurar' });
  const origen = process.env.URL || new URL(req.url).origin;
  const [status, out] = await manejar(body, {
    store: getStore({ name: 'generador-guiones', consistency: 'strong' }),
    verificar: (slug, code) => verificarAgencia(slug, code, origen),
    env,
    ia: (pedido, extra = {}) => llamarClaude({ apiKey: process.env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL, pedido, ...extra }),
  });
  return json(status, out);
};

export const config = { path: '/api/ia' };
