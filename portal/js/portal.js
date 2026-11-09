/* Portal de agencias — acceso por usuario y contraseña.
   Los datos de cada agencia están en portal/data/<id>.json, encriptados con AES-GCM.
   El <id> sale de un hash del usuario, así que el nombre de la agencia no aparece en ningún archivo público.
   La clave se deriva de la contraseña de la agencia (PBKDF2-SHA256), así que sin la contraseña correcta
   el archivo no se puede leer. La contraseña nunca se guarda en el servidor.
   Los reportes subidos como archivo están en portal/data/r/<id>.json, encriptados con la misma contraseña. */
(function () {
  const ITER = 200000;
  const SESSION = 'kickstart.portal';
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  // Igual que normalizar_usuario() en tools/publicar_portal.py: sin tildes, minúsculas, solo letras y números
  function normUsuario(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  async function idUsuario(usuario) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('kickstart-portal|' + normUsuario(usuario)));
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }

  async function deriveKey(code, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.trim()), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('no-data');
    return r.json();
  }

  async function descifrar(url, code) {
    const box = await fetchJSON(url);
    const key = await deriveKey(code, b64(box.salt));
    try {
      return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(box.iv) }, key, b64(box.ct)));
    } catch (e) {
      throw new Error('codigo');
    }
  }

  async function abrir(slug, code) {
    const plain = await descifrar('data/' + encodeURIComponent(slug) + '.json', code);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // Reporte subido como archivo: devuelve {tipo, nombre, datos} con los bytes originales
  async function abrirArchivo(id, code) {
    const plain = await descifrar('data/r/' + encodeURIComponent(id) + '.json', code);
    const obj = JSON.parse(new TextDecoder().decode(plain));
    return { tipo: obj.tipo || 'text/html', nombre: obj.nombre || '', datos: b64(obj.datos) };
  }

  // Login: busca la agencia por su usuario y prueba la contraseña. Error 'usuario' si no existe, 'codigo' si no abre.
  async function ingresar(usuario, code) {
    const slug = await idUsuario(usuario);
    let data;
    try { data = await abrir(slug, code); }
    catch (e) { throw new Error(e.message === 'no-data' ? 'usuario' : e.message); }
    guardar({ slug, code: code.trim(), nombre: data.empresa.nombre, tipo: data.tipo || 'completo' });
    return data;
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
  // Las agencias de solo anuncios ven únicamente sus reportes
  const soloAnuncios = s => (s && s.tipo) === 'anuncios';

  // Barra lateral común a todas las páginas del portal. data = datos desencriptados (opcional).
  const ICON = {
    panel: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    plan: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    rep: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    drive: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    ads: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    reel: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    flyer: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg = k => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICON[k]}</svg>`;
  const link = (href, k, label, on, ext) => `<a href="${esc(href)}" class="navitem${on ? ' active' : ''}"${on ? ' aria-current="page"' : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${svg(k)}${label}${ext ? ' ↗' : ''}</a>`;
  const off = (k, label) => `<div class="navitem disabled" title="Próximamente">${svg(k)}<span>${label}<span class="mono" style="display:block; font-size:10px; letter-spacing:.06em;">PRÓXIMAMENTE</span></span></div>`;
  function urlSegura(u) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } }

  function sidebar(active, data) {
    const el = document.querySelector('.portal-sidebar'); if (!el) return;
    const s = leer() || {};
    const drive = data && urlSegura(data.drive);
    const nav = soloAnuncios(s)
      ? `${link('reportes.html', 'rep', 'Reportes', active === 'reportes')}
      ${drive ? link(drive, 'drive', 'Drive', false, true) : ''}`
      : `${link('dashboard.html', 'panel', 'Panel', active === 'panel')}
      ${link('planificacion.html', 'plan', 'Planificación', active === 'plan')}
      ${link('reportes.html', 'rep', 'Reportes', active === 'reportes')}
      ${drive ? link(drive, 'drive', 'Drive', false, true) : off('drive', 'Drive')}
      <div class="mono" style="font-size:11px; color:var(--muted); padding:16px 16px 6px; letter-spacing:.08em;">HERRAMIENTAS IA</div>
      ${off('ads', 'Guiones para anuncios')}
      ${off('reel', 'Guiones para reels')}
      ${off('flyer', 'Generador de flyers')}`;
    el.innerHTML = `
    <a href="${soloAnuncios(s) ? 'reportes.html' : 'dashboard.html'}" style="display:flex; align-items:center; gap:10px; padding:0 6px;">
      <img src="../images/logo-2026/kickstart-icono.svg" alt="Kickstart" style="width:34px; height:34px; object-fit:contain;">
      <div style="font-family:'Poppins'; font-size:16px; letter-spacing:.03em; color:var(--white);">PORTAL AGENCIAS</div>
    </a>
    <nav style="display:flex; flex-direction:column; gap:4px;" aria-label="Portal">
      ${nav}
    </nav>
    <div style="margin-top:auto; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-top:1px solid var(--line);">
      <div style="font-size:13px; color:var(--white);">${esc(s.nombre || '')}</div>
      <a href="login.html" class="mono js-salir" style="font-size:11px; color:var(--muted);">Salir</a>
    </div>`;
    el.querySelector('.js-salir').addEventListener('click', e => { e.preventDefault(); salir(); });
  }

  window.Portal = { sidebar, urlSegura, esc, abrir, abrirArchivo, ingresar, guardar, leer, salir, requerirSesion, soloAnuncios, normUsuario, idUsuario };
})();
