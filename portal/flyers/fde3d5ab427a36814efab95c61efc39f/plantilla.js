/* Plantilla de flyer: historia 1080×1920 (estética del PSD "estetica_2_final").
   La carpeta se llama con el id de la agencia en el portal (hash de su usuario), igual que portal/data/<id>.json,
   así que solo la ve la agencia que entra con ese usuario. La carga y usa portal/flyers.html.

   Contrato con flyers.html:
   - campos: lo que completa la agencia (secciones del formulario).
   - ajustes: deslizadores propios de esta plantilla (además de zoom y encuadre, que da flyers.html).
   - dibujar(ctx, h): dibuja el flyer. h.v(id) = texto de un campo, h.on(id) = casilla marcada,
     h.n(id) = valor de un ajuste, h.img[nombre] = imágenes cargadas, h.fondo() = dibuja la foto de fondo,
     h.aviso(id, texto) = muestra un aviso debajo de un campo. */
window.PlantillaFlyer = {
  nombre: 'Historia 1080×1920',
  archivo: 'flyer',
  W: 1080, H: 1920,
  fuentes: [
    { family: 'Lexend Deca', weight: 300, file: 'lexend-deca-300.woff2' },
    { family: 'Lexend Deca', weight: 700, file: 'lexend-deca-700.woff2' },
    { family: 'Lexend Deca', weight: 800, file: 'lexend-deca-800.woff2' }
  ],
  imagenes: { logoSup: 'logo-superior.png', logoInf: 'logo-inferior.png' },
  muestra: { file: 'foto-muestra.jpg', ox: -9.5, oy: -52 },

  secciones: [
    { titulo: 'Paquete', campos: [
      { id: 'destino', label: 'Destino', tipo: 'textarea', filas: 2, hint: 'Enter = salto de línea', valor: 'Porto de\nGalinhas' },
      { id: 'fecha', label: 'Fecha / salida', valor: 'Enero 2027' },
      { id: 'showFecha', label: 'Mostrar fecha', tipo: 'check', valor: true },
      { id: 'incluye', label: 'Qué incluye', valor: 'Aéreos - 7 Noches - Traslados - desayuno' },
      { id: 'cta', label: 'Llamado a la acción', valor: 'Reservá Hoy' },
      { id: 'showCta', label: 'Mostrar llamado a la acción', tipo: 'check', valor: true }
    ]},
    { titulo: 'Precio', campos: [
      { id: 'desde', label: 'Texto superior', valor: 'desde', medio: true },
      { id: 'moneda', label: 'Moneda', tipo: 'select', opciones: ['usd', 'ars', '$', 'eur'], valor: 'usd', medio: true },
      { id: 'precio', label: 'Precio', valor: '1450' },
      { id: 'base', label: 'Aclaración', valor: 'por persona - base doble' }
    ]},
    { titulo: 'Legales', campos: [
      { id: 'legales', label: 'Texto legal', tipo: 'textarea', filas: 3, hint: 'Hasta 4 líneas. Si el precio es en pesos, cambiá la moneda acá también.',
        valor: 'Tarifa dinámica sujeta a disponibilidad. Incluye impuestos.\nTarifa expresada en moneda dólar estadounidense. Tarifa en BASE DOBLE.\nGF Travel SRL Leg 17169' }
    ]}
  ],
  ajustes: [
    { id: 'altura', label: 'Altura del bloque de texto', hint: 'más a la derecha = más arriba', min: 0, max: 300, step: 1, valor: 170 },
    { id: 'oscuro', label: 'Oscurecido del fondo', min: 0, max: 1.3, step: 0.01, valor: 1 }
  ],

  dibujar(ctx, h) {
    const W = 1080, H = 1920, FONT = "'Lexend Deca'";
    const C = { white: '#F9F7F7', yellow: '#FBB03B', red: '#990B07', dark: '#1A1B14', legal: '#1A2020' };
    const font = (w, s) => `${w} ${s}px ${FONT}`;
    // Píldoras y caja de precio: esquinas superior derecha e inferior izquierda redondeadas
    const leaf = (x, y, w, hh, r, color) => {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + hh); ctx.lineTo(x + r, y + hh); ctx.arcTo(x, y + hh, x, y + hh - r, r); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
    };
    // Achica el texto si no entra en maxW
    const fit = (t, w, s, maxW) => {
      ctx.font = font(w, s); const m = ctx.measureText(t).width;
      if (m <= maxW) return { size: s, w: m };
      const s2 = s * maxW / m; ctx.font = font(w, s2); return { size: s2, w: ctx.measureText(t).width };
    };
    const v = h.v;

    // 1. Foto y degradado (oscuro arriba a la izquierda → transparente)
    h.fondo();
    const k = h.n('oscuro'), a = x => Math.min(1, x * k);
    const g = ctx.createLinearGradient(289.25, 6.1, 790.75, 1913.9);
    g.addColorStop(0, `rgba(49,30,30,${a(.85)})`);
    g.addColorStop(.30, `rgba(88,23,21,${a(.41)})`);
    g.addColorStop(.58, 'rgba(128,16,13,0)');
    g.addColorStop(1, 'rgba(128,16,13,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(h.img.logoSup, 470, 62, 133, 110);
    ctx.textBaseline = 'alphabetic';
    const dy = -h.n('altura');

    // 2. Destino: crece hacia arriba, la última línea queda fija
    const lines = v('destino').split('\n').map(s => s.trim()).filter(Boolean);
    let tSize = 154.4, lead = 137.2;
    ctx.font = font(800, tSize);
    let maxW = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
    if (maxW > 940) { const f = 940 / maxW; tSize *= f; lead *= f; ctx.font = font(800, tSize); maxW = Math.max(...lines.map(l => ctx.measureText(l).width)); }
    h.aviso('destino', tSize < 154.3 ? 'El texto es largo: se achicó para que entre.' : '');
    const cx = 555.5, lastBase = 750 + dy, firstBase = lastBase - lead * (lines.length - 1);
    ctx.fillStyle = C.white; ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, cx, firstBase + lead * i));
    const asc = lines.length ? ctx.measureText(lines[0]).actualBoundingBoxAscent : 0;
    const titleTop = firstBase - asc, titleRight = cx + maxW / 2;

    // 3. Fecha: píldora oscura arriba del destino
    ctx.textAlign = 'left';
    if (h.on('showFecha') && v('fecha').trim()) {
      const t = v('fecha').trim(), f = fit(t, 700, 36, 700);
      const w = f.w + 56, hh = 58, right = Math.min(1050, Math.max(titleRight + 13, w + 40));
      const y = Math.max(190, titleTop - 16 - hh), x = right - w;
      leaf(x, y, w, hh, hh, C.dark);
      ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.fillText(t, x + 30, y + 36.7);
    }
    // 4. Qué incluye
    if (v('incluye').trim()) {
      const t = v('incluye').trim(), f = fit(t, 700, 30.4, 860);
      h.aviso('incluye', f.size < 30.3 ? 'Texto largo: se achicó. Probá abreviarlo.' : '');
      const w = f.w + 92, x = 566 - w / 2; leaf(x, 773 + dy, w, 58, 58, C.yellow);
      ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.fillText(t, x + 52, 809.7 + dy);
    } else h.aviso('incluye', '');
    // 5. Llamado a la acción
    if (h.on('showCta') && v('cta').trim()) {
      const t = v('cta').trim(), f = fit(t, 700, 49.9, 800);
      const w = f.w + 81, x = 557 - w / 2; leaf(x, 847 + dy, w, 58, 58, C.yellow);
      ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.fillText(t, x + 49, 890.1 + dy);
    }
    // 6. Precio
    leaf(648, 1432, 602, 178, 80, C.red);
    ctx.fillStyle = C.white; ctx.textAlign = 'left';
    ctx.font = font(300, 33.3); ctx.fillText(v('desde'), 692, 1476);
    const p = v('precio').trim(), fp = fit(p, 700, 119.3, 312);
    ctx.font = font(700, fp.size); ctx.fillText(p, 682, 1569);
    ctx.save(); ctx.translate(682 + fp.w + 46, 1525); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
    const fm = fit(v('moneda'), 700, 47, 160); ctx.font = font(700, fm.size); ctx.fillText(v('moneda'), 0, 0); ctx.restore();
    ctx.textAlign = 'left'; ctx.font = font(300, fit(v('base'), 300, 24, 340).size); ctx.fillText(v('base'), 689, 1592);
    // 7. Logo inferior y legales
    ctx.drawImage(h.img.logoInf, 314, 1726, 429, 71);
    ctx.fillStyle = C.legal; ctx.textAlign = 'center';
    v('legales').split('\n').slice(0, 4).forEach((l, i) => { const f = fit(l, 700, 20.1, 1000); ctx.font = font(700, f.size); ctx.fillText(l, 543.4, 1827.3 + 19.9 * i); });
  }
};
