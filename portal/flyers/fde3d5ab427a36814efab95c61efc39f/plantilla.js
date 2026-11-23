/* Plantilla de flyer: historia 1080×1920 (estética del PSD "estetica_2_final").
   La carpeta se llama con el id de la agencia en el portal (hash de su usuario), igual que portal/data/<id>.json,
   así que solo la ve la agencia que entra con ese usuario. La carga y usa portal/flyers.html.

   Contrato con flyers.html:
   - campos: lo que completa la agencia (secciones del formulario).
   - ajustes: deslizadores propios de esta plantilla (además de zoom y encuadre, que da flyers.html).
   - dibujar(ctx, h): dibuja el flyer. h.formato = id del formato elegido, h.W / h.H = tamaño. h.v(id) = texto de un campo, h.on(id) = casilla marcada,
     h.n(id) = valor de un ajuste, h.img[nombre] = imágenes cargadas, h.fondo() = dibuja la foto de fondo,
     h.aviso(id, texto) = muestra un aviso debajo de un campo. */
window.PlantillaFlyer = {
  archivo: 'flyer',
  // Formatos de descarga. El primero es el de inicio.
  formatos: [
    { id: 'historia', nombre: 'Historia', W: 1080, H: 1920 },
    { id: 'cuadrado', nombre: 'Cuadrado', W: 1080, H: 1080 }
  ],
  fuentes: [
    { family: 'Lexend Deca', weight: 300, file: 'lexend-deca-300.woff2' },
    { family: 'Lexend Deca', weight: 700, file: 'lexend-deca-700.woff2' },
    { family: 'Lexend Deca', weight: 800, file: 'lexend-deca-800.woff2' }
  ],
  imagenes: { logoSup: 'logo-superior.png', logoInf: 'logo-inferior.png' },
  muestra: { file: 'foto-muestra.jpg', ox: -9.5, oy: -52 },

  secciones: [
    { titulo: 'Paquete', campos: [
      { id: 'destino', label: 'Destino', tipo: 'textarea', filas: 2, max: 30, lineas: 2, hint: 'Corto. Máximo 2 líneas (Enter = salto de línea).', valor: 'Porto de\nGalinhas' },
      { id: 'fecha', label: 'Fecha / salida', max: 18, hint: 'Ej: Enero 2027 · Salida 14/03 · Semana Santa', valor: 'Enero 2027' },
      { id: 'showFecha', label: 'Mostrar fecha', tipo: 'check', valor: true },
      { id: 'incluye', label: 'Qué incluye', max: 48, hint: '2 a 4 ítems cortos separados por guiones.', valor: 'Aéreos - 7 Noches - Traslados - desayuno' },
      { id: 'cta', label: 'Llamado a la acción', max: 14, valor: 'Reservá Hoy' },
      { id: 'showCta', label: 'Mostrar llamado a la acción', tipo: 'check', valor: true }
    ]},
    { titulo: 'Precio', campos: [
      { id: 'desde', label: 'Texto superior', max: 10, valor: 'desde', medio: true },
      { id: 'moneda', label: 'Moneda', tipo: 'select', opciones: ['usd', 'ars', '$', 'eur'], valor: 'usd', medio: true },
      { id: 'precio', label: 'Precio', max: 10, hint: 'Solo el número. Si hay varios, el más bajo.', valor: '1450' },
      { id: 'base', label: 'Aclaración', max: 28, valor: 'por persona - base doble' }
    ]},
    { titulo: 'Legales', campos: [
      { id: 'legales', label: 'Texto legal', tipo: 'textarea', filas: 3, max: 300, lineas: 4, hint: 'Hasta 4 líneas. Si el precio es en pesos, cambiá la moneda acá también.',
        valor: 'Tarifa dinámica sujeta a disponibilidad. Incluye impuestos.\nTarifa expresada en moneda dólar estadounidense. Tarifa en BASE DOBLE.\nGF Travel SRL Leg 17169' }
    ]}
  ],
  // Qué campo completa cada dato del ordenador de información (IA)
  ia: { destino: 'destino', fecha: 'fecha', incluye: 'incluye', cta: 'cta', precio: 'precio', moneda: 'moneda', aclaracion: 'base' },

  ajustes: [
    { id: 'tamDestino', label: 'Tamaño del destino', hint: 'agrandá los destinos cortos o achicá los largos', min: 0.7, max: 1.8, step: 0.01, valor: 1 },
    { id: 'altura', label: 'Altura del bloque de texto', hint: 'más a la derecha = más arriba', min: 0, max: 300, step: 1, valor: 170 },
    { id: 'oscuro', label: 'Oscurecido del fondo', min: 0, max: 1.3, step: 0.01, valor: 1 }
  ],

  dibujar(ctx, h) {
    const W = h.W, H = h.H, FONT = "'Lexend Deca'";
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

    // Posiciones de cada formato. La historia replica el PSD; el cuadrado es una adaptación con el bloque de texto al 80 %.
    // "altura" (deslizador) sube el bloque de texto; 170 es la posición por defecto.
    const alt = h.n('altura') - 170;
    const L = h.formato === 'cuadrado'
      // Cuadrado: todo centrado y arriba (logo → fecha → destino → incluye → CTA), armado de arriba hacia abajo
      ? { s: .8, logoSup: [500, 34, 80, 66], cx: 540, arriba: 124 - alt * .5, titleMax: 900, fechaMinY: 110, incCx: 540, ctaCx: 540, centrado: true,
          px: 648, py: 676, ps: .72, logoInf: [325.5, 936, 429, 71], legX: 540, legY: 1030 }
      : { s: 1, logoSup: [470, 62, 133, 110], cx: 555.5, lastBase: 580 - alt, titleMax: 940, fechaMinY: 190, incCx: 566, ctaCx: 557,
          px: 648, py: 1432, logoInf: [314, 1726, 429, 71], legX: 543.4, legY: 1827.3 };
    const s = L.s;

    // 1. Foto y degradado (oscuro arriba a la izquierda → transparente)
    h.fondo();
    const k = h.n('oscuro'), a = x => Math.min(1, x * k), fy = H / 1920;
    const g = ctx.createLinearGradient(289.25, 6.1 * fy, 790.75, 1913.9 * fy);
    g.addColorStop(0, `rgba(49,30,30,${a(.85)})`);
    g.addColorStop(.30, `rgba(88,23,21,${a(.41)})`);
    g.addColorStop(.58, 'rgba(128,16,13,0)');
    g.addColorStop(1, 'rgba(128,16,13,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(h.img.logoSup, ...L.logoSup);
    ctx.textBaseline = 'alphabetic';

    // 2. Destino: crece hacia arriba, la última línea queda fija
    const lines = v('destino').split('\n').map(x => x.trim()).filter(Boolean);
    const kd = h.n('tamDestino') || 1;   // tamaño del destino elegido por la agencia
    let tSize = 154.4 * s * kd, lead = 137.2 * s * kd;
    ctx.font = font(800, tSize);
    let maxW = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
    if (maxW > L.titleMax) { const f = L.titleMax / maxW; tSize *= f; lead *= f; ctx.font = font(800, tSize); maxW = Math.max(...lines.map(l => ctx.measureText(l).width)); }
    h.aviso('destino', tSize < 154.3 * s * kd ? 'El texto es largo: se achicó para que entre.' : '');
    const asc = lines.length ? ctx.measureText(lines[0]).actualBoundingBoxAscent : 0;
    const conFecha = h.on('showFecha') && v('fecha').trim();
    let firstBase, lastBase;
    if (L.arriba != null) {   // de arriba hacia abajo: la fecha arriba y el destino debajo
      firstBase = L.arriba + (conFecha ? (58 + 16) * s : 0) + asc;
      lastBase = firstBase + lead * (lines.length - 1);
    } else {                  // historia: la última línea queda fija y el destino crece hacia arriba
      lastBase = L.lastBase; firstBase = lastBase - lead * (lines.length - 1);
    }
    ctx.fillStyle = C.white; ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, L.cx, firstBase + lead * i));
    const titleTop = firstBase - asc, titleRight = L.cx + maxW / 2;

    // 3. Fecha: píldora oscura arriba del destino
    ctx.textAlign = 'left';
    if (conFecha) {
      const t = v('fecha').trim(), f = fit(t, 700, 36 * s, 700 * s);
      const w = f.w + 56 * s, hh = 58 * s, right = Math.min(W - 30, Math.max(titleRight + 13 * s, w + 40));
      const y = Math.max(L.fechaMinY, titleTop - 16 * s - hh), x = L.centrado ? L.cx - w / 2 : right - w;
      leaf(x, y, w, hh, hh, C.dark);
      ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.fillText(t, x + 30 * s, y + 36.7 * s);
    }
    // 4. Qué incluye
    const incY = lastBase + 23 * s, ctaY = incY + 74 * s;
    if (v('incluye').trim()) {
      const t = v('incluye').trim(), f = fit(t, 700, 30.4 * s, 860 * (s < 1 ? 1.1 * s : 1));
      h.aviso('incluye', f.size < 30.3 * s ? 'Texto largo: se achicó. Probá abreviarlo.' : '');
      const w = f.w + 92 * s, x = L.incCx - w / 2; leaf(x, incY, w, 58 * s, 58 * s, C.yellow);
      ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.fillText(t, x + 52 * s, incY + 36.7 * s);
    } else h.aviso('incluye', '');
    // 5. Llamado a la acción
    if (h.on('showCta') && v('cta').trim()) {
      const t = v('cta').trim(), f = fit(t, 700, 49.9 * s, 800 * s);
      const w = f.w + 81 * s, x = L.ctaCx - w / 2; leaf(x, ctaY, w, 58 * s, 58 * s, C.yellow);
      ctx.font = font(700, f.size); ctx.fillStyle = C.white; ctx.fillText(t, x + 49 * s, ctaY + 43.1 * s);
    }
    // 6. Precio (sin precio cargado, no va la caja)
    // La caja sale del borde derecho y se agranda hacia la izquierda si el precio es largo (en vez de achicar el número).
    // ps = tamaño del bloque de precio (1 = como el PSD).
    const p = v('precio').trim(), ps = L.ps || 1, Y = L.py + 178 * (1 - ps);
    if (p) {
      ctx.font = font(700, 119.3 * ps);
      const anchoNum = ctx.measureText(p).width, sobra = (34 + 46 + 40) * ps;   // margen izq. + moneda + margen der.
      const X = Math.max(40, Math.min(L.px + 432 * (1 - ps), W - (anchoNum + sobra)));
      leaf(X, Y, W - X + 200, 178 * ps, 80 * ps, C.red);
      ctx.fillStyle = C.white; ctx.textAlign = 'left';
      ctx.font = font(300, 33.3 * ps); ctx.fillText(v('desde'), X + 44 * ps, Y + 44 * ps);
      const fp = fit(p, 700, 119.3 * ps, W - X - sobra);
      ctx.font = font(700, fp.size); ctx.fillText(p, X + 34 * ps, Y + 137 * ps);
      ctx.save(); ctx.translate(X + 34 * ps + fp.w + 46 * ps, Y + 93 * ps); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center';
      const fm = fit(v('moneda'), 700, 47 * ps, 160 * ps); ctx.font = font(700, fm.size); ctx.fillText(v('moneda'), 0, 0); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = font(300, fit(v('base'), 300, 24 * ps, Math.max(340 * ps, W - X - 60 * ps)).size); ctx.fillText(v('base'), X + 41 * ps, Y + 160 * ps);
    }
    h.aviso('legales', v('moneda') !== 'usd' && /d[óo]lar/i.test(v('legales')) ? 'Ojo: el texto legal habla de dólares y el precio está en otra moneda.' : '');
    // 7. Logo inferior y legales. En el cuadrado van sobre una franja clara para que se lean con cualquier foto.
    if (h.formato === 'cuadrado') {
      const f = ctx.createLinearGradient(0, 870, 0, H);
      f.addColorStop(0, 'rgba(249,247,247,0)'); f.addColorStop(.45, 'rgba(249,247,247,.82)'); f.addColorStop(1, 'rgba(249,247,247,.92)');
      ctx.fillStyle = f; ctx.fillRect(0, 870, W, H - 870);
    }
    ctx.drawImage(h.img.logoInf, ...L.logoInf);
    ctx.fillStyle = C.legal; ctx.textAlign = 'center';
    v('legales').split('\n').slice(0, 4).forEach((l, i) => { const f = fit(l, 700, 20.1, 1000); ctx.font = font(700, f.size); ctx.fillText(l, L.legX, L.legY + 19.9 * i); });
  }
};
