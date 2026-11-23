/* Plantilla de flyer de Aterrizar (sucursal Oliva), del PSD "Rio_Buzios_Aterrizar_Oliva_capas" (1254×1254).
   Cuadrado 1080×1080 (réplica del PSD) e historia 1080×1920 (adaptación: arriba y abajo quedan igual, la foto se ve en el medio).
   Se dibuja en las medidas del PSD (1254 de ancho) y se escala al tamaño de descarga.
   Tipografía: Gilroy Heavy y Medium (la de la marca Aterrizar; el PSD traía una genérica).
   Los íconos de los servicios se dibujan acá (el PSD traía símbolos de texto que no se ven bien en todos lados).
   El logo "aterrizar · Sucursal Oliva" es la capa del PSD.
   Contrato con flyers.html: ver la plantilla de GF Travel. */
window.PlantillaFlyer = {
  archivo: 'flyer',
  formatos: [
    { id: 'cuadrado', nombre: 'Cuadrado', W: 1080, H: 1080 },
    { id: 'historia', nombre: 'Historia', W: 1080, H: 1920 }
  ],
  fuentes: [
    { family: 'Gilroy AO', weight: 500, file: 'gilroy-medium.woff2' },
    { family: 'Gilroy AO', weight: 900, file: 'gilroy-heavy.woff2' }
  ],
  imagenes: { logo: 'logo.png' },
  muestra: { file: 'foto-muestra.jpg', ox: 0, oy: 0 },

  secciones: [
    { titulo: 'Paquete', campos: [
      { id: 'frase', label: 'Frase de arriba (opcional)', max: 26, hint: 'Va en mayúsculas, entre las dos rayitas amarillas. Dejala vacía para no mostrarla.', valor: 'Brasil te espera' },
      { id: 'destino', label: 'Destino', tipo: 'textarea', filas: 2, max: 24, lineas: 2, hint: 'Corto. Máximo 2 líneas (Enter = salto de línea).', valor: 'Maragogi' },
      { id: 'destacado', label: 'Etiqueta amarilla (opcional)', max: 16, hint: 'Ej: 7 noches, Enero 2027. Si la dejás vacía, toma las noches de la lista de abajo.', valor: '' },
      { id: 'incluye', label: 'Qué incluye', tipo: 'textarea', filas: 4, max: 110, lineas: 5, hint: 'Un ítem por línea, hasta 4 (más las noches). Para una segunda línea más chica usá "/": Aéreos / ida y vuelta', valor: 'Aéreos / ida y vuelta\n7 noches\nTraslados / in - out\nCon / desayuno' }
    ]},
    { titulo: 'Precio', campos: [
      { id: 'desde', label: 'Texto superior', max: 10, valor: 'desde', medio: true },
      { id: 'moneda', label: 'Moneda', tipo: 'select', opciones: ['usd', 'ars', '$', 'eur'], valor: 'usd', medio: true },
      { id: 'precio', label: 'Precio', max: 10, hint: 'Solo el número. Si hay varios, el más bajo. El punto de los miles se pone solo.', valor: '899' },
      { id: 'base', label: 'Aclaración', max: 28, valor: 'por persona' }
    ]}
  ],
  // Qué campo completa cada dato del ordenador de información (IA)
  ia: { destino: 'destino', incluye: 'incluye', precio: 'precio', moneda: 'moneda', aclaracion: 'base' },

  ajustes: [
    { id: 'tamDestino', label: 'Tamaño del destino', hint: 'agrandá los destinos cortos o achicá los largos', min: 0.7, max: 1.8, step: 0.01, valor: 1 },
    { id: 'altura', label: 'Altura del bloque de arriba', hint: 'más a la derecha = más abajo', min: 0, max: 200, step: 1, valor: 0 },
    { id: 'respaldo', label: 'Franja blanca detrás del precio', min: 0, max: 1.6, step: 0.01, valor: 1 }
  ],

  dibujar(ctx, h) {
    const C = { white: '#FFFFFF', yellow: '#FFCD00', violeta: '#390D64', zocalo: '#30055B' };
    const FONT = "'Gilroy AO'";
    const font = (w, s) => `${w} ${s}px ${FONT}`;
    const v = h.v;
    const historia = h.formato === 'historia';
    const k = h.W / 1254, VH = h.H / k;            // todo se dibuja en medidas del PSD
    const T = (historia ? 250 : 0) + h.n('altura');   // bloque de arriba
    const B = VH - 1254;                             // bloque de abajo (precio y zócalo) pegado al pie
    const spacing = px => { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; };
    const encoger = (t, w, s, maxW) => { ctx.font = font(w, s); const m = ctx.measureText(t).width; if (m <= maxW) return s; return s * maxW / m; };
    const rrect = (x, y, w, hh, r) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };

    // 1. Foto de fondo
    h.fondo();
    ctx.save(); ctx.scale(k, k);
    ctx.textBaseline = 'alphabetic';

    // 2. Frase de arriba con las dos rayitas amarillas
    const frase = v('frase').trim().toUpperCase();
    if (frase) {
      ctx.font = font(900, 29); spacing(8); ctx.textAlign = 'center'; ctx.fillStyle = C.white;
      let fs = 29; const wf = () => ctx.measureText(frase).width;
      if (wf() > 760) { fs = 29 * 760 / wf(); ctx.font = font(900, fs); }
      ctx.fillText(frase, 627 + 4, T + 77);
      const half = wf() / 2, gap = 40;
      const largo = Math.max(30, Math.min(105, 627 - half - gap - 60));
      ctx.fillStyle = C.yellow;
      rrect(627 - half - gap - largo, T + 69, largo, 7, 3.5); ctx.fill();
      rrect(627 + half + gap, T + 69, largo, 7, 3.5); ctx.fill();
      spacing(0);
    }

    // 3. Destino (1 o 2 líneas) con la curva amarilla debajo
    const lines = v('destino').split('\n').map(x => x.trim()).filter(Boolean);
    const kd = h.n('tamDestino') || 1;   // tamaño del destino elegido por la agencia
    const ts0 = lines.length > 1 ? 104 : 126;
    let ts = ts0 * kd;
    ctx.font = font(900, ts); ctx.textAlign = 'left'; ctx.fillStyle = C.white;
    const maxT = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
    if (maxT > 1100) ts *= 1100 / maxT;
    h.aviso('destino', ts < ts0 * kd - .1 ? 'El texto es largo: se achicó para que entre.' : '');
    ctx.font = font(900, ts);
    // Si el destino quedó más grande que el diseño, baja lo que crecen las mayúsculas (así no pisa la frase de arriba)
    let crece = 0;
    if (lines.length) { const a = ctx.measureText(lines[0]).actualBoundingBoxAscent; ctx.font = font(900, ts0); crece = Math.max(0, a - ctx.measureText(lines[0]).actualBoundingBoxAscent); ctx.font = font(900, ts); }
    const lead = ts * .98, base0 = T + (lines.length > 1 ? 210 : 220) + crece;
    let ultima = base0;
    lines.forEach((l, i) => { ultima = base0 + lead * i; ctx.fillText(l, 78, ultima); });
    if (lines.length) {
      const wl = ctx.measureText(lines[lines.length - 1]).width;
      const y = ultima + 28 * ts / 126;
      ctx.beginPath(); ctx.moveTo(78 + wl * .05, y); ctx.quadraticCurveTo(78 + wl * .45, y - 63 * ts / 126, 78 + wl * .85, y);
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 13 * ts / 126; ctx.lineCap = 'round'; ctx.stroke();
    }
    const top = Math.max(T + 312, ultima + 92);   // donde arrancan los servicios y la etiqueta

    // 4. Lista de servicios: "Título / detalle", un ítem por línea (también acepta "A - B - C" del ordenador con IA)
    const crudo = v('incluye');
    let items = crudo.split(crudo.includes('\n') ? '\n' : ' - ').map(x => x.trim()).filter(Boolean);
    const esNoches = t => /^\s*\d+\s*noches?\b/i.test(t);
    let destacado = v('destacado').trim();
    if (!destacado) { const n = items.find(esNoches); if (n) destacado = n.split('/')[0].trim(); }
    items = items.filter(t => !(esNoches(t) && t.split('/')[0].trim().toLowerCase() === destacado.toLowerCase())).slice(0, 4);

    const icono = (t, cx, cy) => {
      const s = t.toLowerCase();
      ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = C.white; ctx.strokeStyle = C.white; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (/a[eé]reo|vuelo|avi[oó]n/.test(s)) {            // avión
        ctx.beginPath();
        ctx.moveTo(22, 0); ctx.lineTo(16, -3); ctx.lineTo(4, -3); ctx.lineTo(-8, -20); ctx.lineTo(-14, -20); ctx.lineTo(-7, -3);
        ctx.lineTo(-16, -3); ctx.lineTo(-20, -9); ctx.lineTo(-24, -9); ctx.lineTo(-21, 0); ctx.lineTo(-24, 9); ctx.lineTo(-20, 9);
        ctx.lineTo(-16, 3); ctx.lineTo(-7, 3); ctx.lineTo(-14, 20); ctx.lineTo(-8, 20); ctx.lineTo(4, 3); ctx.lineTo(16, 3); ctx.closePath(); ctx.fill();
      } else if (/traslado|bus|transfer|auto/.test(s)) {    // combi
        rrect(-20, -18, 40, 30, 6); ctx.stroke();
        ctx.fillRect(-14, -12, 28, 10);
        ctx.beginPath(); ctx.arc(-11, 16, 5, 0, Math.PI * 2); ctx.arc(11, 16, 5, 0, Math.PI * 2); ctx.fill();
      } else if (/desayuno|pensi[oó]n|inclusive|comida|cena|almuerzo/.test(s)) {   // taza
        rrect(-18, -6, 28, 24, 5); ctx.stroke();
        ctx.beginPath(); ctx.arc(13, 6, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.lineWidth = 3;
        [-10, -1, 8].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 4, -12); ctx.quadraticCurveTo(x + 2, -17, x - 2, -24); ctx.stroke(); });
      } else if (/hotel|aloj|noche|resort|posada/.test(s)) { // cama
        ctx.fillRect(-22, -14, 5, 32); ctx.fillRect(-22, 4, 44, 6); ctx.fillRect(17, 4, 5, 14);
        rrect(-14, -6, 12, 9, 3); ctx.fill(); rrect(1, -8, 21, 11, 4); ctx.fill();
      } else if (/asist|seguro/.test(s)) {                    // escudo
        ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(17, -14); ctx.quadraticCurveTo(17, 10, 0, 21); ctx.quadraticCurveTo(-17, 10, -17, -14); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-1, 6); ctx.lineTo(8, -5); ctx.stroke();
      } else if (/excursi|paseo|tour|city/.test(s)) {         // cámara
        rrect(-21, -10, 42, 28, 6); ctx.stroke(); ctx.fillRect(-8, -16, 16, 6);
        ctx.beginPath(); ctx.arc(0, 4, 8, 0, Math.PI * 2); ctx.stroke();
      } else {                                                // tilde
        ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-2, 7); ctx.lineTo(9, -7); ctx.stroke();
      }
      ctx.restore();
    };

    const paso = 95;
    items.forEach((t, i) => {
      const y = top + paso * i;
      const [tit, ...resto] = t.split('/'); const sub = resto.join('/').trim();
      const titulo = tit.trim().toUpperCase(), detalle = sub.toUpperCase();
      icono(t, 125, y + 37);
      ctx.fillStyle = C.yellow; rrect(174, y, 7, 70, 3); ctx.fill();
      ctx.fillStyle = C.white; ctx.textAlign = 'left';
      let w = 0;
      if (detalle) {
        ctx.font = font(900, encoger(titulo, 900, 30, 480)); ctx.fillText(titulo, 202, y + 28); w = ctx.measureText(titulo).width;
        ctx.font = font(900, encoger(detalle, 900, 27, 480)); ctx.fillText(detalle, 202, y + 61); w = Math.max(w, ctx.measureText(detalle).width);
      } else {
        ctx.font = font(900, encoger(titulo, 900, 32, 480)); ctx.fillText(titulo, 202, y + 47); w = ctx.measureText(titulo).width;
      }
      if (i < items.length - 1) {
        ctx.beginPath(); ctx.moveTo(202, y + 74); ctx.lineTo(202 + Math.max(258, w + 40), y + 74);
        ctx.strokeStyle = C.white; ctx.lineWidth = 2; ctx.stroke();
      }
    });

    // 5. Etiqueta amarilla (noches o lo que se cargue), alineada a la derecha
    if (destacado) {
      const t = destacado.toUpperCase();
      const fs = encoger(t, 900, 42, 360);
      ctx.font = font(900, fs); const tw = ctx.measureText(t).width;
      const luna = /noche/i.test(t);
      const pw = Math.max(300, tw + (luna ? 150 : 110)), px = 1110 - pw;
      ctx.fillStyle = C.yellow; rrect(px, top, pw, 98, 48); ctx.fill();
      let tx = px + pw / 2 - tw / 2;
      if (luna) {
        tx += 22;
        const mx = tx - 36, my = top + 49;
        ctx.beginPath(); ctx.arc(mx, my, 17, 0, Math.PI * 2); ctx.fillStyle = C.violeta; ctx.fill();          // luna:
        ctx.beginPath(); ctx.arc(mx + 9, my - 8, 15, 0, Math.PI * 2); ctx.fillStyle = C.yellow; ctx.fill();   // círculo violeta tapado por uno amarillo
      }
      ctx.fillStyle = C.violeta; ctx.textAlign = 'left'; ctx.fillText(t, tx, top + 64);
    }

    // 6. Franja blanca suave detrás del precio (capa "Respaldo del precio")
    const r = h.n('respaldo');
    if (r > 0) {
      const y0 = B + 931, y1 = B + 1185, g = ctx.createLinearGradient(0, y0, 0, y1);
      const a = Math.min(1, .51 * r);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.31, `rgba(255,255,255,${a})`);
      g.addColorStop(.71, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, y0, 1254, y1 - y0);
    }

    // 7. Precio: DESDE / moneda / número / aclaración
    let p = v('precio').trim();
    if (/^\d{4,}$/.test(p)) p = p.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (p) {
      const mon = (v('moneda') || '').toUpperCase();
      let ns = 150, ms = 75;
      ctx.font = font(900, ns); let wn = ctx.measureText(p).width;
      ctx.font = font(900, ms); let wm = mon ? ctx.measureText(mon).width + 15 : 0;
      const kk = Math.min(1, 760 / (wn + wm)); ns *= kk; ms *= kk; wn *= kk; wm *= kk;
      const x0 = 515 - (wn + wm) / 2, xn = x0 + wm, Y = B + 1015;
      ctx.fillStyle = C.violeta; ctx.textAlign = 'left';
      if (mon) { ctx.font = font(900, ms); ctx.fillText(mon, x0, Y - 35 * kk); }
      ctx.font = font(900, ns); ctx.fillText(p, xn, Y);
      const desde = v('desde').trim().toUpperCase();
      if (desde) { ctx.font = font(900, 43); ctx.fillText(desde, x0 - 10, Y - 122 * kk); }
      const base = v('base').trim().toUpperCase();
      if (base) {
        ctx.textAlign = 'center'; spacing(11);
        const bs = encoger(base, 900, 31, 640); ctx.font = font(900, bs);
        ctx.fillText(base, Math.min(xn + wn / 2, 627) + 5, Y + 50); spacing(0);
      }
    }

    // 8. Zócalo violeta con la línea amarilla y el logo de la sucursal
    ctx.beginPath(); ctx.moveTo(0, B + 1160); ctx.quadraticCurveTo(310, B + 1080, 627, B + 1118); ctx.quadraticCurveTo(940, B + 1155, 1254, B + 1198);
    ctx.lineTo(1254, VH); ctx.lineTo(0, VH); ctx.closePath(); ctx.fillStyle = C.zocalo; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, B + 1160); ctx.quadraticCurveTo(310, B + 1080, 627, B + 1118); ctx.quadraticCurveTo(940, B + 1155, 1254, B + 1198);
    ctx.strokeStyle = C.yellow; ctx.lineWidth = 12; ctx.lineCap = 'butt'; ctx.stroke();
    const lg = h.img.logo;
    ctx.drawImage(lg, 627 - 380 / 2, B + 1138, 380, 380 * lg.height / lg.width);
    ctx.restore();
  }
};
