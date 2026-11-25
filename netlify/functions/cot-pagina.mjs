// Link público de una cotización: /c/<id>. Devuelve la página del pasajero (cotizacion/index.html) con el título, la
// descripción y la foto de esa cotización en las etiquetas que usa WhatsApp para armar la vista previa del link.
import { getStore } from '@netlify/blobs';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async (req, context) => {
  const origen = process.env.URL || new URL(req.url).origin;
  const id = (context.params && context.params.id) || '';
  const base = await fetch(`${origen}/cotizacion/index.html`);
  let html = await base.text();
  let titulo = 'Propuesta de viaje', desc = 'Tu propuesta de viaje personalizada.', img = '';
  if (/^[A-Za-z0-9]{12}$/.test(id)) {
    const c = await getStore({ name: 'cotizaciones', consistency: 'strong' }).get(`cot/${id}`, { type: 'json' }).catch(() => null);
    if (c && !c.borrada) {
      const d = c.datos || {};
      titulo = (d.pasajero ? d.pasajero + ': ' : '') + (d.titulo || 'Propuesta de viaje') + (c.agencia ? ' · ' + c.agencia : '');
      desc = [d.fechasTexto, d.noches ? d.noches + ' noches' : '', d.frase].filter(Boolean).join(' · ');
      const f = (d.fotos || [])[0];
      if (f && f.url) img = f.url.startsWith('/') ? origen + f.url : f.url;
    }
  }
  const meta = `<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}">` +
    (img ? `<meta property="og:image" content="${esc(img)}">` : '') + '<meta property="og:type" content="website"><meta name="robots" content="noindex">';
  html = html.replace('<!--OG-->', meta).replace('<title>Propuesta de viaje</title>', `<title>${esc(titulo)}</title>`);
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
};

export const config = { path: '/c/:id' };
