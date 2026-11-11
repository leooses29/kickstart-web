// Lógica del Generador de Guiones del portal: créditos mensuales por agencia, llamada a la IA y registro de usos.
// Las dependencias (almacenamiento, verificación de la agencia, llamada a la IA) se inyectan para poder probarla.
import { INSTRUCCIONES } from './instrucciones.mjs';

export const CREDITOS_POR_DEFECTO = 40;
const MAX = { destino: 80, paquete: 900, precio: 160, publico: 120, palabra: 24, extra: 400, ajuste: 300 };

export function mesActual(d = new Date()) {
  // Mes en hora de Argentina (UTC-3), para que el reinicio sea el 1° a las 00:00 de Argentina
  const ar = new Date(d.getTime() - 3 * 3600 * 1000);
  return ar.toISOString().slice(0, 7);
}

const recortar = (s, n) => String(s == null ? '' : s).trim().slice(0, n);

export function limpiarFormulario(f = {}) {
  return {
    destino: recortar(f.destino, MAX.destino),
    paquete: recortar(f.paquete, MAX.paquete),
    precio: recortar(f.precio, MAX.precio),
    publico: recortar(f.publico, MAX.publico),
    palabra: recortar(f.palabra, MAX.palabra).toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ0-9]/g, ''),
    extra: recortar(f.extra, MAX.extra),
  };
}

export function armarPedido(form, agencia, ajuste, anterior) {
  const l = [`Agencia: ${agencia}`, `Destino: ${form.destino}`, `Paquete (qué incluye, noches, salida y fechas): ${form.paquete || 'no informado'}`,
    `Precio: ${form.precio || 'no informado'}`];
  if (form.publico) l.push(`Público: ${form.publico}`);
  if (form.palabra) l.push(`Palabra clave para el CTA: ${form.palabra}`);
  if (form.extra) l.push(`Indicaciones de la agencia: ${form.extra}`);
  let txt = 'Escribí un guion para este anuncio.\n\n' + l.join('\n');
  if (anterior) {
    txt += `\n\nVersión anterior (no repitas sus hooks):\n${JSON.stringify(anterior)}`;
    txt += `\n\nLa agencia pide este cambio: ${ajuste || 'otra versión distinta, con otro hook principal'}`;
  }
  return txt;
}

export function extraerJSON(texto) {
  const a = texto.indexOf('{'), b = texto.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('respuesta_invalida');
  const o = JSON.parse(texto.slice(a, b + 1));
  if (!o.hookPrincipal || !Array.isArray(o.guion) || !o.guion.length) throw new Error('respuesta_invalida');
  o.hooksAlternativos = Array.isArray(o.hooksAlternativos) ? o.hooksAlternativos.slice(0, 3) : [];
  o.datosFaltantes = Array.isArray(o.datosFaltantes) ? o.datosFaltantes : [];
  return o;
}

export async function llamarClaude({ apiKey, model, pedido, fetchImpl = fetch }) {
  const r = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model, max_tokens: 4000,
      // Sin razonamiento previo y con esfuerzo bajo: el guion es corto, así sale más rápido y más barato.
      // (Sonnet no acepta "disabled"; "between_tools" equivale a no pensar cuando no hay herramientas.)
      thinking: { type: /haiku/.test(model) ? 'disabled' : 'between_tools' },
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: INSTRUCCIONES, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: pedido }],
    }),
  });
  if (!r.ok) {
    const detalle = await r.text().catch(() => '');
    const err = new Error('ia_error'); err.status = r.status; err.detalle = detalle.slice(0, 500); throw err;
  }
  const j = await r.json();
  const texto = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  if (j.stop_reason && j.stop_reason !== 'end_turn') console.error('Generador de guiones: stop_reason', j.stop_reason);
  return { texto, uso: j.usage || {} };
}

// --- Créditos ---
async function leerCreditos(store, slug, mes) {
  return (await store.get(`creditos/${slug}/${mes}`, { type: 'json' })) || { usados: 0, extra: 0 };
}

export function limiteDe(datos, c, env) {
  const base = Number(datos && datos.creditosIA) > 0 ? Number(datos.creditosIA) : (Number(env.CREDITOS_MES) || CREDITOS_POR_DEFECTO);
  return base + (Number(c.extra) || 0);
}

function resumenCreditos(datos, c, env, mes) {
  const limite = limiteDe(datos, c, env);
  return { mes, usados: c.usados || 0, limite, restantes: Math.max(0, limite - (c.usados || 0)) };
}

// --- Acciones de la agencia ---
export async function manejar(body, deps) {
  const { store, verificar, env, ia, ahora = new Date() } = deps;
  const { accion, slug, code } = body || {};
  const datos = await verificar(slug, code);
  if (!datos) return [401, { error: 'sesion' }];
  const agencia = (datos.empresa && datos.empresa.nombre) || '';
  const mes = mesActual(ahora);
  const c = await leerCreditos(store, slug, mes);

  if (accion === 'estado') {
    const lista = await store.list({ prefix: `registros/${mes}/` });
    const mios = [];
    for (const b of lista.blobs || []) {
      if (!b.key.endsWith(`-${slug}`)) continue;
      const r = await store.get(b.key, { type: 'json' });
      if (r) mios.push({ id: b.key.split('/').pop(), fecha: r.fecha, destino: r.form.destino, form: r.form, titulo: r.salida && r.salida.titulo, resultado: r.salida, voto: r.voto || 0 });
    }
    mios.sort((a, b) => b.fecha.localeCompare(a.fecha));
    return [200, { creditos: resumenCreditos(datos, c, env, mes), historial: mios.slice(0, 20) }];
  }

  if (accion === 'generar') {
    const form = limpiarFormulario(body.form);
    if (!form.destino) return [400, { error: 'falta_destino' }];
    const limite = limiteDe(datos, c, env);
    if ((c.usados || 0) >= limite) return [402, { error: 'sin_creditos', creditos: resumenCreditos(datos, c, env, mes) }];
    let anterior = null;
    if (body.baseId) {
      const prev = await store.get(`registros/${mes}/${String(body.baseId).replace(/[^a-z0-9-]/gi, '')}`, { type: 'json' });
      if (prev && prev.slug === slug) anterior = prev.salida;
    }
    const ajuste = recortar(body.ajuste, MAX.ajuste);
    const pedido = armarPedido(form, agencia, ajuste, anterior);
    let salida, uso;
    try {
      const r = await ia(pedido);
      uso = r.uso;
      try { salida = extraerJSON(r.texto); }
      catch (e) { e.detalle = String(r.texto || '').slice(0, 300); throw e; }
    } catch (e) {
      console.error('Generador de guiones:', e.message, e.status || '', e.detalle || '');
      return [502, { error: 'ia', creditos: resumenCreditos(datos, c, env, mes) }];
    }
    // El crédito se descuenta solo si el guion salió bien
    const c2 = await leerCreditos(store, slug, mes);
    c2.usados = (c2.usados || 0) + 1;
    await store.setJSON(`creditos/${slug}/${mes}`, c2);
    const id = `${ahora.getTime()}-${slug}`;
    await store.setJSON(`registros/${mes}/${id}`, {
      fecha: ahora.toISOString(), slug, agencia, form, ajuste: anterior ? (ajuste || 'otra versión') : '', baseId: anterior ? body.baseId : '',
      salida, modelo: env.ANTHROPIC_MODEL || '', uso: uso || {}, voto: 0, comentario: '',
    });
    return [200, { id, resultado: salida, creditos: resumenCreditos(datos, c2, env, mes) }];
  }

  if (accion === 'voto') {
    const id = String(body.id || '').replace(/[^a-z0-9-]/gi, '');
    const key = `registros/${mes}/${id}`;
    const r = await store.get(key, { type: 'json' });
    if (!r || r.slug !== slug) return [404, { error: 'no_encontrado' }];
    r.voto = body.voto === 1 ? 1 : body.voto === -1 ? -1 : 0;
    r.comentario = recortar(body.comentario, 500);
    await store.setJSON(key, r);
    return [200, { ok: true }];
  }

  return [400, { error: 'accion' }];
}

// Igual que idUsuario() en portal/js/portal.js
export function normUsuario(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
export async function idUsuario(usuario) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kickstart-portal|' + normUsuario(usuario)));
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// --- Panel de Kickstart (protegido con ADMIN_KEY) ---
export async function manejarAdmin(body, deps) {
  const { store, ahora = new Date() } = deps;
  const mes = /^\d{4}-\d{2}$/.test(body.mes || '') ? body.mes : mesActual(ahora);
  if (body.accion === 'sumar') {
    const slug = body.usuario ? await idUsuario(body.usuario) : String(body.slug || '');
    if (!/^[a-f0-9]{32}$/.test(slug)) return [400, { error: 'slug' }];
    const c = await leerCreditos(store, slug, mes);
    c.extra = (Number(c.extra) || 0) + Math.max(-1000, Math.min(1000, Math.trunc(Number(body.cantidad) || 0)));
    await store.setJSON(`creditos/${slug}/${mes}`, c);
    return [200, { ok: true, creditos: c }];
  }
  const lista = await store.list({ prefix: `registros/${mes}/` });
  const registros = [];
  for (const b of lista.blobs || []) {
    const r = await store.get(b.key, { type: 'json' });
    if (r) registros.push({ id: b.key.split('/').pop(), ...r });
  }
  registros.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const agencias = {};
  for (const r of registros) {
    const a = agencias[r.slug] || (agencias[r.slug] = { slug: r.slug, agencia: r.agencia, guiones: 0, positivos: 0, negativos: 0, tokensEntrada: 0, tokensSalida: 0 });
    a.guiones++; if (r.voto === 1) a.positivos++; if (r.voto === -1) a.negativos++;
    a.tokensEntrada += (r.uso.input_tokens || 0) + (r.uso.cache_read_input_tokens || 0) + (r.uso.cache_creation_input_tokens || 0);
    a.tokensSalida += r.uso.output_tokens || 0;
  }
  for (const a of Object.values(agencias)) a.creditos = await leerCreditos(store, a.slug, mes);
  return [200, { mes, agencias: Object.values(agencias), registros }];
}
