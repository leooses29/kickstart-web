/* Plantilla de la Secuencia de historias (1080×1920) de Netanya Viajes y Turismo, con la estética de su flyer.
   Vive en la misma carpeta que plantilla.js (el flyer) y usa sus mismos logos, letras de "Reservá Hoy!" y tipografía.
   La carga y usa portal/historias.html. Contrato: ver la plantilla de historias de GF Travel.
   tema() junta lo propio de Netanya (colores, logos, etiquetas); dibujar() es la estructura común de las 3 historias:
   hook, información del paquete (sin precio: el precio va solo en el flyer) y llamado a la acción. */
window.PlantillaHistorias = {
  fuentes: [
    { family: 'Netanya Kanit', weight: 300, file: 'kanit-300.woff2' },
    { family: 'Netanya Kanit', weight: 700, file: 'kanit-700.woff2' },
    { family: 'Netanya Kanit', weight: 700, style: 'italic', file: 'kanit-700-italic.woff2' }
  ],
  imagenes: { logoSup: 'logo-superior.png', logoInf: 'logo-inferior.png', reserva: 'cta-reserva.png', hoy: 'cta-hoy.png' },
  muestra: { file: 'foto-muestra.jpg' },
  archivo: 'netanya',

  valores: {
    destino: 'Isla Margarita', fecha: 'Enero y Febrero', incluye: 'Aéreos\nTraslados\nAll inclusive\nAsistencia', cta: 'Reservá Hoy!',
    desde: 'desde', moneda: 'usd', precio: '1840', base: 'por persona - base doble', legales: '',
    hook: '3 cosas que no sabías de *Isla Margarita*', hookBtn: 'Mirá esto →', ctaTitulo: 'Escribinos y te pasamos *las fechas*'
  },

  tema(ctx, h) {
    const C = { white: '#FCFBF7', hi: '#FF6A2B', accent: '#DE5614', accentText: '#FCFBF7', dark: 'rgba(252,251,247,.94)', darkText: '#DE5614', checkBg: '#DE5614', checkFg: '#FCFBF7' };
    // El logo de abajo (naranja, con la leyenda legal) va en blanco: sobre la foto oscurecida el naranja no se lee
    const blanco = im => {
      if (!im._blanco) {
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height);
        im._blanco = c;
      }
      return im._blanco;
    };
    return {
      FONT: "'Netanya Kanit'", C, wTitle: 700, wPill: 700, wItem: 700, wBody: 300, wBold: 700, pillItalic: true,
      radio: hh => hh * .32, tinte: '46,18,6', oscuro: '10,11,13', limite: 1640, legalesY: 1880, extraDestino: 0,
      MON: { usd: 'US$', ars: '$', $: '$', eur: '€' },
      fechaTexto: f => /^salida/i.test(f) ? f : 'Salidas: ' + f,
      arriba: () => ctx.drawImage(h.img.logoSup, 838, 99, 154, 167),
      destinoHook: (u, d, cx, y) => u.pill(d, cx, y, 40, C.accent, C.white, 820, 36),
      bajoDestino: () => {},
      // El flyer de Netanya separa los servicios con guiones o barras en una sola línea: acá también
      items: its => its.length > 1 ? its : its.flatMap(t => t.split(/\s*[\/|]\s*/)).map(x => x.trim()).filter(Boolean),
      tituloIncluye: (u, x, y) => { ctx.font = u.font(700, 42, true); ctx.fillStyle = C.hi; ctx.textAlign = 'left'; ctx.fillText('El paquete incluye', x, y); },
      // "Reservá Hoy!" con las letras del diseño; otro texto, en una etiqueta naranja
      boton: (u, t, cx, y) => {
        const norm = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
        if (norm !== 'reservahoy') return u.pill(t, cx, y, 54, C.accent, C.white, 820, 52).h;
        const s = 1.4, x0 = cx - 536 * s / 2;
        ctx.drawImage(h.img.reserva, x0, y + 20 * s, 287 * s, 62 * s);
        ctx.save(); ctx.shadowColor = 'rgba(10,11,13,.31)'; ctx.shadowBlur = 9; ctx.drawImage(h.img.hoy, x0 + 305 * s, y, 231 * s, 107 * s); ctx.restore();
        return 107 * s;
      },
      pie: () => ctx.drawImage(blanco(h.img.logoInf), 540 - 388 / 2, 1700, 388, 115)
    };
  },

  dibujar(tipo, ctx, h) {
    const T = this.tema(ctx, h), C = T.C, W = 1080, H = 1920, v = h.v, A = x => Math.min(1, x * h.oscuro);
    const font = (w, s, it) => `${it ? 'italic ' : ''}${w} ${s}px ${T.FONT}`;
    const fit = (t, w, s, maxW, it) => {
      ctx.font = font(w, s, it); const m = ctx.measureText(t).width;
      if (m <= maxW) return { size: s, w: m };
      const s2 = s * maxW / m; ctx.font = font(w, s2, it); return { size: s2, w: ctx.measureText(t).width };
    };
    const forma = (x, y, w, hh, color) => { ctx.beginPath(); ctx.roundRect(x, y, w, hh, Math.min(T.radio(hh), hh / 2, w / 2)); ctx.fillStyle = color; ctx.fill(); };
    const capa = (y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
    const sombra = on => { ctx.shadowColor = on ? 'rgba(0,0,0,.35)' : 'transparent'; ctx.shadowBlur = on ? 28 : 0; ctx.shadowOffsetY = on ? 4 : 0; };
    const rgba = (rgb, a) => `rgba(${rgb},${a})`;
    // Etiqueta con texto centrado en cx (o arrancando en x0 si se pasa)
    const pill = (t, cx, y, size, bg, fg, maxW, padX, x0) => {
      const it = T.pillItalic, f = fit(t, T.wPill, size, maxW, it), hh = Math.round(size * 1.75), w = f.w + padX * 2, x = x0 != null ? x0 : cx - w / 2;
      forma(x, y, w, hh, bg); ctx.font = font(T.wPill, f.size, it); ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(t, x + padX, y + hh / 2 + 2); ctx.textBaseline = 'alphabetic'; return { x, w, h: hh };
    };
    // Texto con *resaltado*, con salto de línea automático: achica hasta que entra en maxLineas
    const armar = (texto, weight, size, maxW, maxLineas) => {
      const paras = texto.split('\n');
      for (let s = size; ; s -= 2) {
        ctx.font = font(weight, s); const sp = ctx.measureText(' ').width; const lines = []; let hl = false;
        for (const p of paras) {
          const words = p.trim().split(/\s+/).filter(Boolean); let line = [], lw = 0;
          for (const raw of words) {
            const parts = []; let buf = '';
            for (const ch of raw) { if (ch === '*') { if (buf) parts.push({ t: buf, y: hl }); buf = ''; hl = !hl; } else buf += ch; }
            if (buf) parts.push({ t: buf, y: hl });
            const ww = parts.reduce((a, q) => a + ctx.measureText(q.t).width, 0);
            if (line.length && lw + sp + ww > maxW) { lines.push({ w: lw, words: line }); line = []; lw = 0; }
            lw += (line.length ? sp : 0) + ww; line.push({ parts, w: ww });
          }
          if (line.length) lines.push({ w: lw, words: line });
        }
        if ((lines.length <= maxLineas && Math.max(0, ...lines.map(l => l.w)) <= maxW) || s <= 48) return { size: s, lines, sp };
      }
    };
    const escribir = (lay, weight, cx, top, lead) => {
      ctx.font = font(weight, lay.size); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      lay.lines.forEach((l, i) => {
        let x = cx - l.w / 2; const y = top + lay.size * .78 + i * lead;
        l.words.forEach((wd, j) => { if (j) x += lay.sp; wd.parts.forEach(p => { ctx.fillStyle = p.y ? C.hi : C.white; ctx.fillText(p.t, x, y); x += ctx.measureText(p.t).width; }); });
      });
      return top + lay.lines.length * lead;
    };
    const legales = () => {
      const ls = v('legales').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 3); if (!ls.length) return;
      ctx.fillStyle = C.white; ctx.globalAlpha = .85; ctx.textAlign = 'center';
      ls.forEach((l, i) => { const f = fit(l, T.wBody, 20, 1000); ctx.font = font(T.wBody, f.size); ctx.fillText(l, W / 2, T.legalesY + 22 * i); });
      ctx.globalAlpha = 1;
    };
    const u = { font, fit, forma, pill, sombra, rgba };
    const tinte = T.tinte, fondoOsc = T.oscuro;

    if (tipo === 'hook') {
      h.fondo();
      ctx.fillStyle = rgba(fondoOsc, A(.30)); ctx.fillRect(0, 0, W, H);
      capa(0, 520, [[0, rgba(fondoOsc, A(.7))], [1, rgba(fondoOsc, 0)]]);
      capa(820, 1920, [[0, rgba(tinte, 0)], [.55, rgba(tinte, A(.62))], [1, rgba(tinte, A(.92))]]);
      T.arriba(u);
      const lay = armar(v('hook').trim() || ' ', T.wTitle, 124, 930, 5), lead = lay.size * 1.04;
      const top = Math.max(380, 980 - lay.lines.length * lead / 2);
      const d = h.destino1(); if (d) T.destinoHook(u, d, W / 2, top - 110);
      sombra(true); const fin = escribir(lay, T.wTitle, W / 2, top, lead); sombra(false);
      if (v('hookBtn').trim()) pill(v('hookBtn').trim(), W / 2, Math.min(T.limite - 90, Math.max(fin + 70, 1330)), 50, C.accent, C.accentText, 760, 46);
      T.pie(u);
      return;
    }

    if (tipo === 'info') {   // Sin precio: el precio va solo en el flyer
      h.fondo();
      ctx.fillStyle = rgba(fondoOsc, A(.55)); ctx.fillRect(0, 0, W, H);
      capa(900, 1920, [[0, rgba(tinte, 0)], [1, rgba(tinte, A(.88))]]);
      T.arriba(u);
      const X = 90, lines = v('destino').split('\n').map(s => s.trim()).filter(Boolean);
      let ts = 132; ctx.font = font(T.wTitle, ts); const mw = Math.max(1, ...lines.map(l => ctx.measureText(l).width)); if (mw > 900) ts *= 900 / mw;
      const its = (T.items ? T.items(h.items()) : h.items()).slice(0, 6), row = its.length > 5 ? 96 : 110, fecha = v('fecha').trim();
      const total = (fecha ? 96 : 0) + lines.length * ts * .92 + T.extraDestino + 70 + 46 + its.length * row;
      let y = Math.max(280, Math.min(960 - total / 2, T.limite - total));
      if (fecha) { pill(T.fechaTexto(fecha), 0, y, 36, C.dark, C.darkText, 800, 30, X); y += 96; }
      ctx.font = font(T.wTitle, ts); ctx.fillStyle = C.white; ctx.textAlign = 'left'; sombra(true);
      lines.forEach((l, i) => ctx.fillText(l, X - 4, y + ts * .78 + i * ts * .92)); sombra(false);
      if (lines.length) { ctx.font = font(T.wTitle, ts); T.bajoDestino(u, X - 4, y + ts * .78 + (lines.length - 1) * ts * .92, ctx.measureText(lines[lines.length - 1]).width, ts); }
      y += lines.length * ts * .92 + T.extraDestino + 70;
      if (its.length) T.tituloIncluye(u, X, y);
      y += 46;
      its.forEach((t, i) => {
        const ry = y + i * row, s = Math.min(66, row - 24);
        forma(X, ry, s, s, C.checkBg);
        ctx.strokeStyle = C.checkFg; ctx.lineWidth = s * .12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(X + s * .27, ry + s * .52); ctx.lineTo(X + s * .44, ry + s * .69); ctx.lineTo(X + s * .74, ry + s * .33); ctx.stroke();
        const f = fit(t, T.wItem, 54, 820); ctx.font = font(T.wItem, f.size); ctx.fillStyle = C.white; ctx.textBaseline = 'middle'; ctx.fillText(t, X + s + 30, ry + s / 2 + 2); ctx.textBaseline = 'alphabetic';
      });
      T.pie(u);
      return;
    }

    if (tipo === 'cta') {
      h.fondo();
      ctx.fillStyle = rgba(fondoOsc, A(.38)); ctx.fillRect(0, 0, W, H);
      capa(0, 1920, [[0, rgba(fondoOsc, A(.65))], [.45, rgba(tinte, A(.55))], [1, rgba(tinte, A(.92))]]);
      T.arriba(u);
      const lay = armar(v('ctaTitulo').trim() || ' ', T.wTitle, 116, 920, 4), lead = lay.size * 1.04;
      const top = Math.max(360, 760 - lay.lines.length * lead / 2);
      sombra(true); let y = escribir(lay, T.wTitle, W / 2, top, lead); sombra(false);
      const precio = v('precio').trim(), mon = T.MON[v('moneda')] ?? v('moneda');
      const sub = v('ctaSub').trim() || [v('fecha').trim() && T.fechaTexto(v('fecha').trim()), precio && [v('desde'), mon, precio].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
      if (sub) { const f = fit(sub, T.wBody, 42, 900); ctx.font = font(T.wBody, f.size); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(sub, W / 2, y + 46); y += 46; }
      y += 60;
      y += T.boton(u, v('cta').trim() || 'Reservá Hoy', W / 2, y);
      if (v('whatsapp').trim()) { ctx.font = font(T.wBold, 44); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText('WhatsApp ' + v('whatsapp').trim(), W / 2, y + 80); y += 80; }
      if (h.vista) {   // Solo en la vista previa: dónde va el sticker de link (no sale en la descarga)
        const sy = Math.min(T.limite - 150, Math.max(y + 70, 1220)), sw = 560, sh = 140;
        ctx.save(); ctx.setLineDash([16, 12]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.roundRect((W - sw) / 2, sy, sw, sh, 28); ctx.stroke(); ctx.restore();
        ctx.font = font(T.wBody, 30); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textAlign = 'center'; ctx.fillText('Acá va el sticker de link', W / 2, sy + sh / 2 + 6);
        ctx.font = font(T.wBody, 22); ctx.fillText('(se agrega al publicar · no sale en la imagen)', W / 2, sy + sh / 2 + 42);
      }
      T.pie(u);
      if (precio) legales();   // Si muestra el precio, van los legales (si la agencia los cargó)
    }
  }
};
