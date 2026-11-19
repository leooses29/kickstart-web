/* Plantilla de la Secuencia de historias (1080×1920) con la estética del flyer de esta agencia.
   Vive en la misma carpeta que plantilla.js (el flyer) y usa sus mismos logos y tipografías.
   La carga y usa portal/historias.html. Si una agencia no tiene este archivo, no ve la herramienta.

   Contrato con historias.html:
   - valores: textos por defecto del formulario.
   - dibujar(tipo, ctx, h): dibuja una historia. tipo = 'hook' | 'info' | 'cta'.
     h.v(id) = texto de un campo, h.fondo() = dibuja la foto de fondo, h.img[nombre] = imágenes cargadas,
     h.oscuro = 0 a 1.4 (deslizador de oscurecido), h.vista = true en la vista previa (false al descargar),
     h.items() = lista de "qué incluye", h.destino1() = destino en una línea.
   - Las palabras entre *asteriscos* del hook y de la frase de llamado a la acción van resaltadas. */
window.PlantillaHistorias = {
  fuentes: [
    { family: 'Lexend Deca', weight: 300, file: 'lexend-deca-300.woff2' },
    { family: 'Lexend Deca', weight: 700, file: 'lexend-deca-700.woff2' },
    { family: 'Lexend Deca', weight: 800, file: 'lexend-deca-800.woff2' }
  ],
  imagenes: { logoSup: 'logo-superior.png', logoInf: 'logo-inferior.png' },
  muestra: { file: 'foto-muestra.jpg' },
  archivo: 'gf-travel',

  valores: {
    destino: 'Porto de\nGalinhas', fecha: 'Enero 2027', incluye: 'Aéreos\n7 Noches\nTraslados\nDesayuno', cta: 'Reservá Hoy',
    desde: 'desde', moneda: 'usd', precio: '1450', base: 'por persona - base doble',
    legales: 'Tarifa dinámica sujeta a disponibilidad. Incluye impuestos.\nTarifa expresada en moneda dólar estadounidense. Tarifa en BASE DOBLE.\nGF Travel SRL Leg 17169',
    hook: '3 cosas que no sabías de *Porto de Galinhas*', hookBtn: 'Mirá esto →', ctaTitulo: 'Escribinos y te pasamos *las fechas*'
  },

  dibujar(tipo, ctx, h) {
    const W = 1080, H = 1920, FONT = "'Lexend Deca'";
    const C = { white: '#F9F7F7', yellow: '#FBB03B', red: '#990B07', dark: '#1A1B14' };
    const font = (w, s) => `${w} ${s}px ${FONT}`;
    const v = h.v, A = x => Math.min(1, x * h.oscuro);
    // Píldoras: esquinas superior derecha e inferior izquierda redondeadas (como el flyer)
    const leaf = (x, y, w, hh, r, color) => {
      r = Math.min(r, hh, w);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + hh); ctx.lineTo(x + r, y + hh); ctx.arcTo(x, y + hh, x, y + hh - r, r); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
    };
    const fit = (t, w, s, maxW) => {
      ctx.font = font(w, s); const m = ctx.measureText(t).width;
      if (m <= maxW) return { size: s, w: m };
      const s2 = s * maxW / m; ctx.font = font(w, s2); return { size: s2, w: ctx.measureText(t).width };
    };
    const capa = (y0, y1, stops) => { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
    const sombra = on => { ctx.shadowColor = on ? 'rgba(0,0,0,.35)' : 'transparent'; ctx.shadowBlur = on ? 28 : 0; ctx.shadowOffsetY = on ? 4 : 0; };
    const pill = (t, cx, y, size, bg, fg, maxW, padX) => {
      const f = fit(t, 700, size, maxW), hh = Math.round(size * 1.75), w = f.w + padX * 2, x = cx - w / 2;
      leaf(x, y, w, hh, hh, bg); ctx.font = font(700, f.size); ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
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
        l.words.forEach((wd, j) => { if (j) x += lay.sp; wd.parts.forEach(p => { ctx.fillStyle = p.y ? C.yellow : C.white; ctx.fillText(p.t, x, y); x += ctx.measureText(p.t).width; }); });
      });
      return top + lay.lines.length * lead;
    };
    // El logo inferior va en blanco: sobre los fondos oscuros de las historias el rojo no se lee
    const logoInfBlanco = () => {
      if (!h.img._logoInfBlanco) {
        const c = document.createElement('canvas'), im = h.img.logoInf; c.width = im.width; c.height = im.height;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height);
        h.img._logoInfBlanco = c;
      }
      return h.img._logoInfBlanco;
    };
    const pie = legales => {
      ctx.drawImage(logoInfBlanco(), 314, 1726, 429, 71);
      if (!legales) return;
      ctx.fillStyle = C.white; ctx.globalAlpha = .85; ctx.textAlign = 'center';
      v('legales').split('\n').slice(0, 4).forEach((l, i) => { const f = fit(l, 700, 20.1, 1000); ctx.font = font(700, f.size); ctx.fillText(l, 543.4, 1827.3 + 19.9 * i); });
      ctx.globalAlpha = 1;
    };
    const logoSup = () => ctx.drawImage(h.img.logoSup, 470, 62, 133, 110);

    if (tipo === 'hook') {
      h.fondo();
      ctx.fillStyle = `rgba(20,14,14,${A(.30)})`; ctx.fillRect(0, 0, W, H);
      capa(0, 520, [[0, `rgba(26,27,20,${A(.7)})`], [1, 'rgba(26,27,20,0)']]);
      capa(820, 1920, [[0, 'rgba(153,11,7,0)'], [.55, `rgba(120,10,8,${A(.62)})`], [1, `rgba(60,8,6,${A(.9)})`]]);
      logoSup();
      const lay = armar(v('hook').trim() || ' ', 800, 124, 930, 5), lead = lay.size * 1.04;
      const top = Math.max(380, 980 - lay.lines.length * lead / 2);
      const d = h.destino1(); if (d) pill(d, W / 2, top - 110, 36, C.dark, C.white, 800, 34);
      sombra(true); const fin = escribir(lay, 800, W / 2, top, lead); sombra(false);
      if (v('hookBtn').trim()) pill(v('hookBtn').trim(), W / 2, Math.min(1500, Math.max(fin + 70, 1330)), 50, C.yellow, C.white, 760, 46);
      pie(false);
      return;
    }

    if (tipo === 'info') {   // Sin precio: el precio va solo en el flyer
      h.fondo();
      ctx.fillStyle = `rgba(22,16,16,${A(.55)})`; ctx.fillRect(0, 0, W, H);
      capa(900, 1920, [[0, 'rgba(120,10,8,0)'], [1, `rgba(70,8,6,${A(.85)})`]]);
      logoSup();
      const X = 90, lines = v('destino').split('\n').map(s => s.trim()).filter(Boolean);
      let ts = 132; ctx.font = font(800, ts); const mw = Math.max(1, ...lines.map(l => ctx.measureText(l).width)); if (mw > 900) ts *= 900 / mw;
      const its = h.items().slice(0, 6), row = its.length > 5 ? 96 : 110, conFecha = !!v('fecha').trim();
      const total = (conFecha ? 96 : 0) + lines.length * ts * .92 + 70 + 46 + its.length * row;
      let y = Math.max(280, 960 - total / 2);
      if (conFecha) {
        const t = v('fecha').trim(), f = fit(t, 700, 36, 700); leaf(X, y, f.w + 60, 62, 62, C.dark);
        ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(t, X + 30, y + 33); ctx.textBaseline = 'alphabetic'; y += 96;
      }
      ctx.font = font(800, ts); ctx.fillStyle = C.white; ctx.textAlign = 'left'; sombra(true);
      lines.forEach((l, i) => ctx.fillText(l, X - 4, y + ts * .78 + i * ts * .92)); sombra(false);
      y += lines.length * ts * .92 + 70;
      if (its.length) { ctx.font = font(700, 40); ctx.fillStyle = C.yellow; ctx.fillText('El paquete incluye', X, y); }
      y += 46;
      its.forEach((t, i) => {
        const ry = y + i * row, s = Math.min(66, row - 24);
        leaf(X, ry, s, s, s * .6, C.yellow);
        ctx.strokeStyle = C.white; ctx.lineWidth = s * .12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(X + s * .27, ry + s * .52); ctx.lineTo(X + s * .44, ry + s * .69); ctx.lineTo(X + s * .74, ry + s * .33); ctx.stroke();
        const f = fit(t, 700, 54, 820); ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.textBaseline = 'middle'; ctx.fillText(t, X + s + 30, ry + s / 2 + 2); ctx.textBaseline = 'alphabetic';
      });
      pie(false);
      return;
    }

    if (tipo === 'cta') {
      h.fondo();
      ctx.fillStyle = `rgba(22,16,16,${A(.38)})`; ctx.fillRect(0, 0, W, H);
      capa(0, 1920, [[0, `rgba(26,27,20,${A(.65)})`], [.45, `rgba(110,12,9,${A(.55)})`], [1, `rgba(70,8,6,${A(.9)})`]]);
      logoSup();
      const lay = armar(v('ctaTitulo').trim() || ' ', 800, 116, 920, 4), lead = lay.size * 1.04;
      const top = Math.max(360, 760 - lay.lines.length * lead / 2);
      sombra(true); let y = escribir(lay, 800, W / 2, top, lead); sombra(false);
      const precio = v('precio').trim();
      const sub = v('ctaSub').trim() || [v('fecha').trim() && ('Salidas ' + v('fecha').trim()), precio && (v('desde') + ' ' + v('moneda') + ' ' + precio)].filter(Boolean).join(' · ');
      if (sub) { const f = fit(sub, 300, 42, 900); ctx.font = font(300, f.size); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(sub, W / 2, y + 46); y += 46; }
      y += 60;
      y += pill(v('cta').trim() || 'Reservá Hoy', W / 2, y, 54, C.yellow, C.white, 820, 52).h;
      if (v('whatsapp').trim()) { ctx.font = font(700, 44); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText('WhatsApp ' + v('whatsapp').trim(), W / 2, y + 80); y += 80; }
      if (h.vista) {   // Solo en la vista previa: dónde va el sticker de link (no sale en la descarga)
        const sy = Math.max(y + 70, 1220), sw = 560, sh = 140;
        ctx.save(); ctx.setLineDash([16, 12]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.roundRect((W - sw) / 2, sy, sw, sh, 28); ctx.stroke(); ctx.restore();
        ctx.font = font(300, 30); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textAlign = 'center'; ctx.fillText('Acá va el sticker de link', W / 2, sy + sh / 2 + 6);
        ctx.font = font(300, 22); ctx.fillText('(se agrega al publicar · no sale en la imagen)', W / 2, sy + sh / 2 + 42);
      }
      pie(!!precio);   // Si muestra el precio, van los legales
    }
  }
};
