/* Plantilla de flyer de Netanya Viajes y Turismo, del PSD "flyer_estetica_2" (historia 1080×1920).
   Historia: réplica del PSD (posiciones y tamaños de sus capas). Cuadrado 1080×1080: adaptación con el bloque de arriba
   al 70 % y el de abajo en horizontal ("Reservá Hoy!" y logo a la izquierda, precio a la derecha).
   Tipografía: el PSD usa Kiro (paga, no viene en el archivo). Mientras tanto va Kanit (Google Fonts, gratis), con los
   tamaños llevados a la misma altura de mayúsculas que Kiro. Para usar Kiro: subir los .woff2 a esta carpeta y cambiar
   "fuentes" (y FONT abajo).
   Logos (arriba blanco, abajo naranja con la leyenda legal) y las letras de "Reservá Hoy!" son capas del PSD.
   Contrato con flyers.html: ver la plantilla de GF Travel. */
window.PlantillaFlyer = {
  archivo: 'flyer-netanya',
  formatos: [
    { id: 'historia', nombre: 'Historia', W: 1080, H: 1920 },
    { id: 'cuadrado', nombre: 'Cuadrado', W: 1080, H: 1080 }
  ],
  fuentes: [
    { family: 'Netanya Kanit', weight: 300, file: 'kanit-300.woff2' },
    { family: 'Netanya Kanit', weight: 700, file: 'kanit-700.woff2' },
    { family: 'Netanya Kanit', weight: 700, style: 'italic', file: 'kanit-700-italic.woff2' }
  ],
  imagenes: { logoSup: 'logo-superior.png', logoInf: 'logo-inferior.png', reserva: 'cta-reserva.png', hoy: 'cta-hoy.png' },
  muestra: { file: 'foto-muestra.jpg', ox: 0, oy: 0 },

  secciones: [
    { titulo: 'Paquete', campos: [
      { id: 'prefijo', label: 'Frase de arriba (opcional)', max: 18, hint: 'Va antes del destino. Dejala vacía para no mostrarla.', valor: 'Viajemos a:' },
      { id: 'destino', label: 'Destino', tipo: 'textarea', filas: 2, max: 30, lineas: 2, hint: 'Corto. Máximo 2 líneas (Enter = salto de línea).', valor: 'Isla Margarita' },
      { id: 'fecha', label: 'Salidas', max: 26, hint: 'Ej: Enero y Febrero · 14 de Marzo. Se escribe "Salidas:" adelante solo.', valor: 'Enero y Febrero' },
      { id: 'showFecha', label: 'Mostrar salidas', tipo: 'check', valor: true },
      { id: 'incluye', label: 'Qué incluye', max: 60, hint: '2 a 4 ítems cortos separados por guiones o barras.', valor: 'Aéreos - Traslados - All inclusive - Asistencia' },
      { id: 'promo', label: 'Etiqueta blanca (opcional)', max: 40, hint: 'Formas de pago o una promo. Dejala vacía para no mostrarla.', valor: '¡Reservá con el 30% y Cuotas fijas!' },
      { id: 'cta', label: 'Llamado a la acción', max: 16, hint: '"Reservá Hoy!" usa las letras del diseño; otro texto se escribe con el mismo estilo.', valor: 'Reservá Hoy!' },
      { id: 'showCta', label: 'Mostrar llamado a la acción', tipo: 'check', valor: true }
    ]},
    { titulo: 'Precio', campos: [
      { id: 'desde', label: 'Texto superior', max: 10, valor: 'desde:', medio: true },
      { id: 'moneda', label: 'Moneda', tipo: 'select', opciones: ['usd', 'ars', '$', 'eur'], valor: 'usd', medio: true },
      { id: 'precio', label: 'Precio', max: 10, hint: 'Solo el número. Si hay varios, el más bajo. "usd" se escribe US$.', valor: '1840' },
      { id: 'base', label: 'Aclaración', max: 30, valor: 'por persona - base doble' }
    ]}
  ],
  // Qué campo completa cada dato del ordenador de información (IA)
  ia: { destino: 'destino', fecha: 'fecha', incluye: 'incluye', cta: 'cta', precio: 'precio', moneda: 'moneda', aclaracion: 'base' },

  ajustes: [
    { id: 'tamDestino', label: 'Tamaño del destino', hint: 'agrandá los destinos cortos o achicá los largos', min: 0.7, max: 1.8, step: 0.01, valor: 1 },
    { id: 'altura', label: 'Altura del bloque de arriba', hint: 'más a la derecha = más abajo', min: -120, max: 260, step: 1, valor: 0 },
    { id: 'sombra', label: 'Sombra detrás del texto de arriba', hint: 'Para fotos claras. En 0 queda como el diseño original.', min: 0, max: 1, step: 0.01, valor: 0 },
    { id: 'altDesde', label: 'Altura de «desde»', hint: 'más a la derecha = más arriba', min: -15, max: 30, step: 1, valor: 0 },
    { id: 'tamMoneda', label: 'Tamaño del símbolo de la moneda', hint: 'más a la izquierda = más chico', min: 0.5, max: 1, step: 0.01, valor: 1 },
    { id: 'altBase', label: 'Altura de «por persona»', hint: 'más a la derecha = más abajo', min: -15, max: 25, step: 1, valor: 0 }
  ],

  dibujar(ctx, h) {
    const W = h.W, H = h.H, FONT = "'Netanya Kanit'";
    const C = { white: '#FCFBF7', orange: '#DE5614', pill: 'rgba(252,251,247,.94)' };
    // Kiro (la del PSD) tiene las mayúsculas más altas que Kanit: los tamaños del PSD se multiplican por K
    const K = 1.118;
    const font = (w, s, it) => `${it ? 'italic ' : ''}${w} ${s * K}px ${FONT}`;
    const v = h.v;
    const fit = (t, w, s, maxW, it) => {
      ctx.font = font(w, s, it); const m = ctx.measureText(t).width;
      if (m <= maxW) return { s, w: m };
      const s2 = s * maxW / m; ctx.font = font(w, s2, it); return { s: s2, w: ctx.measureText(t).width };
    };
    const rr = (x, y, w, hh, r) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    // Sombra de los textos del PSD: negra al 40 %, 3 px hacia abajo, 9 px de difuminado
    const sombra = on => { ctx.shadowColor = on ? 'rgba(10,11,13,.40)' : 'transparent'; ctx.shadowBlur = on ? 9 : 0; ctx.shadowOffsetY = on ? 3 : 0; ctx.shadowOffsetX = 0; };

    // 1. Foto de fondo (+ sombra opcional arriba para fotos claras)
    h.fondo();
    const sb = h.n('sombra');
    if (sb > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, H * .55);
      g.addColorStop(0, `rgba(10,11,13,${.55 * sb})`); g.addColorStop(1, 'rgba(10,11,13,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * .55);
    }

    // Cuadrado: los dos bloques del PSD al 70 %, uno pegado arriba y otro abajo
    const cuadrado = h.formato === 'cuadrado', S = cuadrado ? .7 : 1;
    const bloque = (yPSD, yDestino) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(540, yDestino); ctx.scale(S, S); ctx.translate(-540, -yPSD); };

    // 2. Bloque de arriba: logo, frase, salidas, destino, servicios y etiqueta blanca
    const alt = h.n('altura');
    ctx.save();
    if (cuadrado) bloque(99, 34 + alt * S);
    ctx.drawImage(h.img.logoSup, 838, 99 - (cuadrado ? alt : 0), 154, 167);   // el logo no se mueve con la altura
    if (!cuadrado) ctx.translate(0, alt);

    const lines = v('destino').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 2);
    const kd = h.n('tamDestino') || 1;   // tamaño del destino elegido por la agencia
    let ts = 148.6 * kd;
    ctx.font = font(700, ts); const mw = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
    if (mw > 940) ts *= 940 / mw;
    h.aviso('destino', ts < 148.6 * kd - .5 ? 'El destino es largo: se achicó para que entre.' : '');
    // Si el destino quedó más grande que el diseño, baja lo que crecen las mayúsculas (así no pisa la frase de arriba)
    let crece = 0;
    if (lines.length) { ctx.font = font(700, 148.6); const a0 = ctx.measureText(lines[0]).actualBoundingBoxAscent; ctx.font = font(700, ts); crece = Math.max(0, ctx.measureText(lines[0]).actualBoundingBoxAscent - a0); }
    const lead = ts * K * .86, extra = (lines.length > 1 ? lead : 0) + crece;   // con 2 líneas, lo de abajo baja una línea

    sombra(true);
    const pre = v('prefijo').trim();
    let finPre = 117;
    if (pre) { const f = fit(pre, 300, 85.9, 400); ctx.font = font(300, f.s); ctx.fillStyle = C.white; ctx.textAlign = 'left'; ctx.fillText(pre, 117, 390); finPre = 117 + f.w; }
    let fecha = v('fecha').trim();
    if (fecha && h.on('showFecha')) {
      if (!/^salida/i.test(fecha)) fecha = 'Salidas: ' + fecha;
      const f = fit(fecha, 700, 38.2, Math.min(560, 944 - finPre - 36), true);
      ctx.font = font(700, f.s, true); ctx.textAlign = 'right'; ctx.fillStyle = C.white; ctx.fillText(fecha, 944, 400);
    }
    ctx.font = font(700, ts); ctx.textAlign = 'center'; ctx.fillStyle = C.white;
    lines.forEach((l, i) => ctx.fillText(l, 544, 522 + crece + i * lead));
    sombra(false);

    const crudo = v('incluye').trim();
    if (crudo) {
      const items = crudo.split(/\s+[-–/|]\s+|\n|\s*\/\s*/).map(x => x.trim()).filter(Boolean);
      const t = items.join(' / ');
      const f = fit(t, 700, 37.5, 960, true);
      const pw = f.w + 34, px = 535.5 - pw / 2, py = 570 + extra;
      ctx.fillStyle = C.orange; rr(px, py, pw, 72, 22); ctx.fill();
      sombra(true); ctx.font = font(700, f.s, true); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(t, 535.5, py + 48.8); sombra(false);
    }
    const promo = v('promo').trim();
    if (promo) {
      const f = fit(promo, 700, 37.5, 900, true);
      const pw = f.w + 42, px = 532.5 - pw / 2, py = 698 + extra;
      ctx.fillStyle = C.pill; rr(px, py, pw, 54, 16); ctx.fill();
      ctx.font = font(700, f.s, true); ctx.fillStyle = C.orange; ctx.textAlign = 'center'; ctx.fillText(promo, 532.5, py + 37.8);
    }
    ctx.restore();

    // 3. Bloque de abajo: precio, "Reservá Hoy!" y logo con la leyenda legal.
    // Historia: uno debajo del otro, como el PSD. Cuadrado: en horizontal, "Reservá Hoy!" y el logo a la izquierda
    // y el precio a la derecha. pon() lleva el punto (px, py) del PSD a (x, y) del cuadrado con escala sc.
    const pon = (px, py, x, y, sc) => { if (!cuadrado) return; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-px, -py); };
    ctx.save();
    const desde = v('desde').trim(), base = v('base').trim();
    let p = v('precio').trim();
    if (p) {
      const MON = { usd: 'US$', ars: '$', $: '$', eur: '€' };
      const mon = MON[v('moneda')] ?? v('moneda');
      // Ajustes de la agencia: "desde" y la aclaración se mueven solos; el símbolo de la moneda puede ir más chico
      const km = h.n('tamMoneda') || 1, yDesde = 1347 - h.n('altDesde'), yBase = 1474.8 + h.n('altBase');
      // Precio = símbolo (al km del tamaño) + número, en la misma línea de base y centrados como un todo
      const medir = sz => { ctx.font = font(700, sz * km); const wm = mon ? ctx.measureText(mon + ' ').width : 0; ctx.font = font(700, sz); return { wm, wn: ctx.measureText(p).width }; };
      let ps = 106.2, m = medir(ps);
      if (m.wm + m.wn > 820) { ps *= 820 / (m.wm + m.wn); m = medir(ps); }
      const fpw = m.wm + m.wn;
      const fd = desde ? fit(desde, 300, 42.4, 820) : { w: 0, s: 42.4 };
      const fb = base ? fit(base, 300, 42.4, 820) : { w: 0, s: 42.4 };
      // La caja naranja crece si "desde" sube o la aclaración baja más allá del diseño
      const top = Math.min(1298, yDesde - 49), bottom = Math.max(1490, yBase + 15.2);
      const bw = Math.max(509, Math.max(fpw, fd.w, fb.w) + 70), bx = 537.5 - bw / 2;
      ctx.save(); pon(537.5, (top + bottom) / 2, 795, 945, Math.min(.8, 470 / bw));
      ctx.fillStyle = C.orange; rr(bx, top, bw, bottom - top, 24.5); ctx.fill();
      sombra(true); ctx.fillStyle = C.white; ctx.textAlign = 'center';
      if (desde) { ctx.font = font(300, fd.s); ctx.fillText(desde, 542.7, yDesde); }
      ctx.textAlign = 'left'; const x0 = 547.5 - fpw / 2;
      if (mon) { ctx.font = font(700, ps * km); ctx.fillText(mon + ' ', x0, 1431.4); }
      ctx.font = font(700, ps); ctx.fillText(p, x0 + m.wm, 1431.4);
      ctx.textAlign = 'center';
      if (base) { ctx.font = font(300, fb.s); ctx.fillText(base, 549.7, yBase); }
      sombra(false);
      ctx.restore();
    }
    const cta = v('cta').trim();
    if (cta && h.on('showCta')) {
      ctx.save(); pon(577, 1570, 285, 885, .72);
      const norm = cta.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
      if (norm === 'reservahoy') {   // las letras originales del PSD
        ctx.drawImage(h.img.reserva, 309, 1537, 287, 62);
        ctx.save(); ctx.shadowColor = 'rgba(10,11,13,.31)'; ctx.shadowBlur = 9; ctx.drawImage(h.img.hoy, 614, 1517, 231, 107); ctx.restore();
      } else {                       // otro texto: primera palabra naranja, el resto blanco y más grande, en itálica
        const [a, ...r] = cta.split(/\s+/); const b = r.join(' ');
        ctx.font = font(700, 64, true); let wa = ctx.measureText(a).width;
        ctx.font = font(700, 100, true); let wb = b ? ctx.measureText(' ' + b).width : 0;
        const k2 = Math.min(1, 760 / (wa + wb)); wa *= k2; wb *= k2;
        const x0 = 577 - (wa + wb) / 2;
        ctx.textAlign = 'left';
        ctx.font = font(700, 64 * k2, true); ctx.fillStyle = C.orange; ctx.fillText(a, x0, 1597);
        if (b) { sombra(true); ctx.font = font(700, 100 * k2, true); ctx.fillStyle = C.white; ctx.fillText(' ' + b, x0 + wa, 1597); sombra(false); }
      }
      ctx.restore();
    }
    pon(554.5, 1773.5, 285, 990, .9);
    ctx.drawImage(h.img.logoInf, 378, 1721, 353, 105);
    ctx.restore();
  }
};
