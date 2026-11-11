// Verifica la sesión de una agencia del portal sin guardar contraseñas en el servidor:
// baja su archivo encriptado (portal/data/<slug>.json) y prueba abrirlo con el código que mandó.
// Si abre, la agencia es quien dice ser. Usa el mismo esquema que portal/js/portal.js
// (AES-GCM con clave PBKDF2-SHA256 de 200.000 iteraciones).
const ITER = 200000;
const b64 = s => Uint8Array.from(Buffer.from(s, 'base64'));

async function deriveKey(code, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(code).trim()), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}

export async function abrirCaja(box, code) {
  const key = await deriveKey(code, b64(box.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.iv) }, key, b64(box.ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

// Devuelve los datos desencriptados de la agencia, o null si el usuario o el código no son válidos.
export async function verificarAgencia(slug, code, origen, fetchImpl = fetch) {
  if (!/^[a-f0-9]{32}$/.test(String(slug || '')) || !code || String(code).length > 200) return null;
  let box;
  try {
    const r = await fetchImpl(`${origen}/portal/data/${slug}.json`, { cache: 'no-store' });
    if (!r.ok) return null;
    box = await r.json();
  } catch (e) {
    return null;
  }
  try {
    return await abrirCaja(box, code);
  } catch (e) {
    return null;
  }
}
