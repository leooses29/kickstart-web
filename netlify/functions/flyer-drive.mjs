// Generador de flyers: guarda un flyer en la carpeta "Paquetes vigentes" de la agencia. POST /api/flyer-drive
// Acciones: estado (¿la agencia tiene carpeta configurada?), guardar ({nombre, tipo, datos} con la imagen en base64),
// fondos ({destino} o {carpetaNombre}: fotos sugeridas del Banco de fondos) y fondo ({id}: una foto en tamaño grande).
// La subida la hace una aplicación web de Google Apps Script (tools/drive-flyers.gs) con la cuenta de Kickstart.
import { verificarAgencia } from '../lib/portal-auth.mjs';
import { CARPETAS_PAQUETES, BANCO_FONDOS, FONDOS_AGENCIA } from '../lib/carpetas-paquetes.mjs';

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const MAX_B64 = 5_600_000;

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'metodo' });
  let body;
  try { body = await req.json(); } catch (e) { return json(400, { error: 'json' }); }
  const origen = process.env.URL || new URL(req.url).origin;
  const datos = await verificarAgencia(body.slug, body.code, origen);
  if (!datos) return json(401, { error: 'sesion' });

  const carpeta = CARPETAS_PAQUETES[body.slug];
  const configurado = !!(process.env.DRIVE_WEBAPP_URL && process.env.DRIVE_SECRET);
  if (body.accion === 'estado') return json(200, { carpeta: !!carpeta, configurado, fondos: configurado && !!BANCO_FONDOS });

  if (body.accion === 'fondos' || body.accion === 'fondo') {
    if (!configurado || !BANCO_FONDOS) return json(503, { error: 'sin_configurar' });
    const pedido = { secreto: process.env.DRIVE_SECRET, accion: body.accion, banco: BANCO_FONDOS, agencia: FONDOS_AGENCIA[body.slug] || '' };
    if (body.accion === 'fondos') { pedido.destino = String(body.destino || '').slice(0, 60); pedido.carpetaNombre = String(body.carpetaNombre || '').slice(0, 80); }
    else pedido.id = String(body.id || '').slice(0, 100);
    try {
      const r = await fetch(process.env.DRIVE_WEBAPP_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow', body: JSON.stringify(pedido) });
      const out = await r.json();
      if (!out.ok) { console.error('Fondos:', out.error, out.detalle || ''); return json(502, { error: 'drive' }); }
      delete out.ok;
      return json(200, out);
    } catch (e) { console.error('Fondos:', e.message); return json(502, { error: 'drive' }); }
  }

  if (body.accion === 'guardar') {
    if (!carpeta) return json(404, { error: 'sin_carpeta' });
    if (!configurado) return json(503, { error: 'sin_configurar' });
    const tipo = body.tipo === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const b64 = String(body.datos || '').replace(/^data:[^,]*,/, '');
    if (!b64 || b64.length > MAX_B64) return json(400, { error: 'archivo' });
    const nombre = String(body.nombre || 'flyer').slice(0, 150);
    try {
      const r = await fetch(process.env.DRIVE_WEBAPP_URL, {
        method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow',
        body: JSON.stringify({ secreto: process.env.DRIVE_SECRET, carpeta, nombre, tipo, datos: b64 }),
      });
      const out = await r.json();
      if (!out.ok) { console.error('Flyer a Drive:', out.error, out.detalle || ''); return json(502, { error: 'drive' }); }
      return json(200, { ok: true, nombre: out.nombre, url: out.url });
    } catch (e) {
      console.error('Flyer a Drive:', e.message);
      return json(502, { error: 'drive' });
    }
  }
  return json(400, { error: 'accion' });
};

export const config = { path: '/api/flyer-drive' };
