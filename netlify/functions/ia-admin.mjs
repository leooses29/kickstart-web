// Panel de Kickstart para el Generador de Guiones: POST /api/ia-admin con el encabezado x-admin-key = ADMIN_KEY.
// Sin acción: devuelve uso por agencia y todos los guiones del mes (con votos y comentarios).
// accion "sumar": suma (o resta) créditos extra a una agencia para el mes ({usuario, cantidad}).
import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
import { manejarAdmin } from '../lib/ia-core.mjs';

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function claveValida(dada) {
  const real = process.env.ADMIN_KEY || '';
  if (real.length < 12 || !dada) return false;
  const a = Buffer.from(String(dada)), b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'metodo' });
  if (!claveValida(req.headers.get('x-admin-key'))) return json(401, { error: 'clave' });
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const [status, out] = await manejarAdmin(body, { store: getStore({ name: 'generador-guiones', consistency: 'strong' }) });
  return json(status, out);
};

export const config = { path: '/api/ia-admin' };
