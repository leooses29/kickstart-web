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

  // Barra lateral común a todas las páginas del portal. data = planificación desencriptada (opcional).
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
    el.innerHTML = `
    <a href="dashboard.html" style="display:flex; align-items:center; gap:10px; padding:0 6px;">
      <img src="../images/icono-kick.png" alt="Kickstart" style="width:34px; height:34px; object-fit:contain;">
      <div style="font-family:'Poppins'; font-size:16px; letter-spacing:.03em; color:var(--white);">PORTAL AGENCIAS</div>
    </a>
    <nav style="display:flex; flex-direction:column; gap:4px;" aria-label="Portal">
      ${link('dashboard.html', 'panel', 'Panel', active === 'panel')}
      ${link('planificacion.html', 'plan', 'Planificación', active === 'plan')}
      ${link('reportes.html', 'rep', 'Reportes', active === 'reportes')}
      ${drive ? link(drive, 'drive', 'Drive', false, true) : off('drive', 'Drive')}
      <div class="mono" style="font-size:11px; color:var(--muted); padding:16px 16px 6px; letter-spacing:.08em;">HERRAMIENTAS IA</div>
      ${off('ads', 'Guiones para anuncios')}
      ${off('reel', 'Guiones para reels')}
      ${off('flyer', 'Generador de flyers')}
    </nav>
    <div style="margin-top:auto; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px; border-top:1px solid var(--line);">
      <div style="font-size:13px; color:var(--white);">${esc(s.nombre || '')}</div>
      <a href="login.html" class="mono js-salir" style="font-size:11px; color:var(--muted);">Salir</a>
    </div>`;
    el.querySelector('.js-salir').addEventListener('click', e => { e.preventDefault(); salir(); });
  }

  window.Portal = { sidebar, urlSegura, esc, abrir, guardar, leer, salir, requerirSesion, agencias: () => fetchJSON('data/agencias.json') };
})();
