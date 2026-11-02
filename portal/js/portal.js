/* Portal de agencias — acceso por código.
   Los datos de cada agencia están en portal/data/<slug>.json, encriptados con AES-GCM.
   La clave se deriva del código de acceso de la agencia (PBKDF2-SHA256), así que sin el
   código correcto el archivo no se puede leer. El código nunca se guarda en el servidor. */
(function () {
  const ITER = 200000;
  const SESSION = 'kickstart.portal';
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function deriveKey(code, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim()), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('no-data');
    return r.json();
  }

  async function abrir(slug, code) {
    const box = await fetchJSON('data/' + encodeURIComponent(slug) + '.json');
    const key = await deriveKey(code, b64(box.salt));
    let plain;
    try {
      plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.iv) }, key, b64(box.ct));
    } catch (e) {
      throw new Error('codigo');
    }
    return JSON.parse(new TextDecoder().decode(plain));
  }

  function guardar(s) { try { sessionStorage.setItem(SESSION, JSON.stringify(s)); } catch (e) {} }
  function leer() { try { return JSON.parse(sessionStorage.getItem(SESSION) || 'null'); } catch (e) { return null; } }
  function salir() { try { sessionStorage.removeItem(SESSION); } catch (e) {} location.href = 'login.html'; }

  // Para las páginas internas: si no hay sesión, vuelve al login
  function requerirSesion() {
    const s = leer();
    if (!s || !s.slug || !s.code) { location.replace('login.html'); return null; }
    return s;
  }

  window.Portal = { abrir, guardar, leer, salir, requerirSesion, agencias: () => fetchJSON('data/agencias.json') };
})();
