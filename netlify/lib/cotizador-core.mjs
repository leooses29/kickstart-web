// Lógica del Cotizador: limpia y guarda cotizaciones, las sirve por link público y registra las aperturas.
// Las dependencias (almacenamiento, verificación de la agencia) se inyectan para poder probarla.

const S = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
const T = (v, n) => String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, n);   // texto que puede tener saltos de línea
const N = (v, min = 0, max = 1e9) => { const x = Number(v); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : null; };
const L = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
const B = v => v === true;

// Solo direcciones https o fotos propias del cotizador; cualquier otra cosa se descarta.
export function urlOk(u, { foto = false } = {}) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (foto && /^\/api\/cot\?img=[A-Za-z0-9/_-]{8,80}$/.test(s)) return s;
  try { const x = new URL(s); return x.protocol === 'https:' ? x.href.slice(0, 600) : ''; } catch (e) { return ''; }
}

const credito = c => c && typeof c === 'object' ? { autor: S(c.autor, 80), autorUrl: urlOk(c.autorUrl), unsplashUrl: urlOk(c.unsplashUrl) } : null;
const foto = f => {
  if (!f || typeof f !== 'object') return null;
  const url = urlOk(f.url, { foto: true }); if (!url) return null;
  return { url, lugar: S(f.lugar, 60), x: N(f.x, 0, 100) ?? 50, y: N(f.y, 0, 100) ?? 50, credito: credito(f.credito), unsplashId: S(f.unsplashId, 40) };
};
const hora = h => /^\d{1,2}:\d{2}$/.test(String(h || '').trim()) ? String(h).trim().padStart(5, '0') : S(h, 8);

// Deja la cotización con la forma y los límites esperados (sirve para lo que devuelve la IA y para lo que guarda el agente).
export function limpiarCotizacion(d = {}) {
  const tipoRuta = t => ['salida', 'destino', 'regreso'].includes(t) ? t : 'destino';
  const moneda = m => { const x = S(m, 3).toUpperCase(); return ['USD', 'ARS', 'EUR'].includes(x) ? x : 'USD'; };
  return {
    pasajero: S(d.pasajero, 60),
    pasajeros: N(d.pasajeros, 1, 60),
    titulo: S(d.titulo, 50),
    frase: S(d.frase, 140),
    gancho: S(d.gancho, 200),
    fechasTexto: S(d.fechasTexto, 40),
    noches: N(d.noches, 0, 120),
    conVuelos: B(d.conVuelos),
    destinos: L(d.destinos, 6).map(x => ({ nombre: S(x && x.nombre, 40), pais: S(x && x.pais, 40), noches: N(x && x.noches, 0, 120), busquedaFoto: S(x && x.busquedaFoto, 60) })).filter(x => x.nombre),
    fotos: L(d.fotos, 12).map(foto).filter(Boolean),
    ruta: L(d.ruta, 6).map(x => ({ nombre: S(x && x.nombre, 30), detalle: S(x && x.detalle, 24), tipo: tipoRuta(x && x.tipo) })).filter(x => x.nombre),
    hoteles: L(d.hoteles, 6).map(x => ({
      nombre: S(x && x.nombre, 70), zona: S(x && x.zona, 70), noches: N(x && x.noches, 0, 120), fechas: S(x && x.fechas, 40),
      regimen: S(x && x.regimen, 40), descripcion: S(x && x.descripcion, 200), web: urlOk(x && x.web), foto: foto(x && x.foto),
    })).filter(x => x.nombre),
    vuelos: L(d.vuelos, 8).map(x => ({
      titulo: S(x && x.titulo, 60), aerolinea: S(x && x.aerolinea, 50), nota: S(x && x.nota, 160),
      tramos: L(x && x.tramos, 4).map(t => ({ sale: hora(t && t.sale), origen: S(t && t.origen, 30), llega: hora(t && t.llega), destino: S(t && t.destino, 30), llegaOtroDia: B(t && t.llegaOtroDia) }))
        .filter(t => t.origen || t.destino),
    })).filter(x => x.titulo || x.tramos.length),
    incluye: L(d.incluye, 14).map(x => S(x, 120)).filter(Boolean),
    avisos: L(d.avisos, 8).map(x => S(x, 220)).filter(Boolean),
    tarifas: L(d.tarifas, 4).map(x => ({ etiqueta: S(x && x.etiqueta, 24), nombre: S(x && x.nombre, 50), detalle: S(x && x.detalle, 140), precio: N(x && x.precio, 0, 1e8), moneda: moneda(x && x.moneda), base: S(x && x.base, 50) }))
      .filter(x => x.nombre || x.precio),
    condiciones: T(d.condiciones, 600),
    dudas: L(d.dudas, 8).map(x => S(x, 240)).filter(Boolean),
    asesor: { nombre: S(d.asesor && d.asesor.nombre, 40), whatsapp: S(d.asesor && d.asesor.whatsapp, 20).replace(/[^\d]/g, '') },
    vigencia: /^\d{4}-\d{2}-\d{2}$/.test(String(d.vigencia || '')) ? d.vigencia : '',
    fondo: d.fondo === 'negro' ? 'negro' : 'blanco',
  };
}

// Respuesta de la IA → cotización (tolera texto alrededor del JSON y comentarios // sueltos)
export function extraerCotizacion(texto) {
  const a = texto.indexOf('{'), b = texto.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('respuesta_invalida');
  let crudo = texto.slice(a, b + 1), o;
  try { o = JSON.parse(crudo); }
  catch (e) { o = JSON.parse(crudo.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*\/\/[^\n"]*$/gm, ',')); }
  const c = limpiarCotizacion(o);
  if (!c.titulo && !c.tarifas.length && !c.hoteles.length) throw new Error('respuesta_invalida');
  return c;
}

export function nuevoId() {
  const abc = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const r = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(r, x => abc[x % abc.length]).join('');
}
const idOk = id => /^[A-Za-z0-9]{12}$/.test(String(id || ''));

// Resumen de seguimiento para el agente
function resumenSeg(seg) {
  if (!seg) return { estado: 'sin_abrir', aperturas: 0 };
  const estado = seg.whatsapp ? 'whatsapp' : seg.lecturas ? 'leida' : seg.aperturas ? 'abierta' : 'sin_abrir';
  return { estado, aperturas: seg.aperturas || 0, lecturas: seg.lecturas || 0, primera: seg.primera || '', ultima: seg.ultima || '', segundos: seg.segundos || 0,
    pestanas: seg.pestanas || {}, tarifa: seg.tarifa || '', whatsapp: seg.whatsapp || 0 };
}

const MAX_DATOS = 90_000, MAX_FOTO_B64 = 1_600_000;
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

// body: { accion, slug, code, ... }. Devuelve [status, objeto].
export async function manejarCot(body, deps) {
  const { store, verificar, ahora = new Date() } = deps;
  const accion = body && body.accion;

  // --- Público (el pasajero, sin login) ---
  if (accion === 'ver') {
    if (!idOk(body.id)) return [404, { error: 'no_encontrada' }];
    const c = await store.get(`cot/${body.id}`, { type: 'json' });
    if (!c || c.borrada) return [404, { error: 'no_encontrada' }];
    return [200, { id: c.id, slug: c.slug, agencia: c.agencia, datos: c.datos, actualizado: c.actualizado }];
  }
  if (accion === 'evento') {
    if (!idOk(body.id)) return [404, { error: 'no_encontrada' }];
    const c = await store.get(`cot/${body.id}`, { type: 'json' });
    if (!c || c.borrada) return [404, { error: 'no_encontrada' }];
    const k = `seg/${body.id}`, seg = (await store.get(k, { type: 'json' })) || {};
    const t = ahora.toISOString(), tipo = String(body.tipo || '');
    if (tipo === 'abrio') { seg.aperturas = (seg.aperturas || 0) + 1; seg.primera = seg.primera || t; seg.ultima = t; }
    else if (tipo === 'leyo') { seg.lecturas = (seg.lecturas || 0) + 1; seg.ultima = t; seg.segundos = Math.max(seg.segundos || 0, N(body.valor, 0, 7200) || 0); }
    else if (tipo === 'pestana') { const p = S(body.valor, 20); if (p) { seg.pestanas = seg.pestanas || {}; if (Object.keys(seg.pestanas).length < 8 || seg.pestanas[p]) seg.pestanas[p] = (seg.pestanas[p] || 0) + 1; } }
    else if (tipo === 'tarifa') seg.tarifa = S(body.valor, 50);
    else if (tipo === 'whatsapp') { seg.whatsapp = (seg.whatsapp || 0) + 1; seg.ultima = t; }
    else return [400, { error: 'tipo' }];
    await store.setJSON(k, seg);
    return [200, { ok: true }];
  }

  // --- Agencia logueada ---
  const datosAg = await verificar(body && body.slug, body && body.code);
  if (!datosAg) return [401, { error: 'sesion' }];
  const slug = body.slug, agencia = (datosAg.empresa && datosAg.empresa.nombre) || '';

  if (accion === 'lista') {
    const l = await store.list({ prefix: `idx/${slug}/` });
    const out = [];
    for (const b of l.blobs || []) {
      const id = b.key.split('/').pop();
      const c = await store.get(`cot/${id}`, { type: 'json' });
      if (!c || c.borrada) continue;
      const seg = await store.get(`seg/${id}`, { type: 'json' });
      out.push({ id, titulo: c.datos.titulo, pasajero: c.datos.pasajero, fechasTexto: c.datos.fechasTexto, creado: c.creado, actualizado: c.actualizado, seg: resumenSeg(seg) });
    }
    out.sort((a, b) => b.actualizado.localeCompare(a.actualizado));
    return [200, { cotizaciones: out.slice(0, 60) }];
  }

  if (accion === 'leer') {
    if (!idOk(body.id)) return [404, { error: 'no_encontrada' }];
    const c = await store.get(`cot/${body.id}`, { type: 'json' });
    if (!c || c.slug !== slug || c.borrada) return [404, { error: 'no_encontrada' }];
    return [200, { id: c.id, datos: c.datos, seg: resumenSeg(await store.get(`seg/${c.id}`, { type: 'json' })) }];
  }

  if (accion === 'guardar') {
    if (JSON.stringify(body.datos || {}).length > MAX_DATOS) return [413, { error: 'grande' }];
    const datos = limpiarCotizacion(body.datos);
    if (!datos.titulo) return [400, { error: 'falta_titulo' }];
    const t = ahora.toISOString();
    let id = body.id, previo = null;
    if (id) {
      if (!idOk(id)) return [400, { error: 'id' }];
      previo = await store.get(`cot/${id}`, { type: 'json' });
      if (!previo || previo.slug !== slug) return [404, { error: 'no_encontrada' }];
    } else id = nuevoId();
    await store.setJSON(`cot/${id}`, { id, slug, agencia, creado: previo ? previo.creado : t, actualizado: t, datos });
    if (!previo) await store.setJSON(`idx/${slug}/${id}`, { creado: t });
    return [200, { id, url: `/c/${id}` }];
  }

  if (accion === 'borrar') {
    if (!idOk(body.id)) return [404, { error: 'no_encontrada' }];
    const c = await store.get(`cot/${body.id}`, { type: 'json' });
    if (!c || c.slug !== slug) return [404, { error: 'no_encontrada' }];
    c.borrada = true; await store.setJSON(`cot/${body.id}`, c); await store.delete(`idx/${slug}/${body.id}`);
    return [200, { ok: true }];
  }

  if (accion === 'foto') {
    const tipo = String(body.tipo || ''), datos = String(body.datos || '').replace(/^data:[^,]*,/, '');
    if (!TIPOS_FOTO.includes(tipo)) return [400, { error: 'tipo' }];
    if (!datos || datos.length > MAX_FOTO_B64 || !/^[A-Za-z0-9+/=]+$/.test(datos)) return [400, { error: 'foto' }];
    const key = `img/${slug.slice(0, 8)}/${nuevoId()}`;
    const bytes = Uint8Array.from(Buffer.from(datos, 'base64'));
    await store.set(key, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), { metadata: { tipo } });
    return [200, { url: `/api/cot?img=${key}` }];
  }

  return [400, { error: 'accion' }];
}

// Foto subida por el agente (pública, con la dirección exacta)
export async function servirFoto(key, store) {
  if (!/^img\/[a-f0-9]{8}\/[A-Za-z0-9]{12}$/.test(String(key || ''))) return null;
  const r = await store.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!r || !r.data) return null;
  return { datos: r.data, tipo: (r.metadata && r.metadata.tipo) || 'image/jpeg' };
}
