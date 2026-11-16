/* Plantilla de flyer de Aterrizar (sucursal Villa María), del PSD "flyer_2026_edith".
   Historia 1080×1920 (réplica del PSD) y cuadrado 1080×1080 (adaptación).
   Tipografía: el PSD usa Gilroy (Heavy y Medium). Mientras no tengamos los archivos de Gilroy se usa Urbanist,
   que es muy parecida: para cambiarla, reemplazar titulos-500.woff2 y titulos-900.woff2 por Gilroy Medium y Heavy.
   La frase "Viví el encanto de:", el pin, la ola y el logo son imágenes sacadas del PSD.
   Contrato con flyers.html: ver la plantilla de GF Travel. */
window.PlantillaFlyer = {
  archivo: 'flyer',
  formatos: [
    { id: 'historia', nombre: 'Historia', W: 1080, H: 1920 },
    { id: 'cuadrado', nombre: 'Cuadrado', W: 1080, H: 1080 }
  ],
  fuentes: [
    { family: 'Titulos AVM', weight: 500, file: 'titulos-500.woff2' },
    { family: 'Titulos AVM', weight: 900, file: 'titulos-900.woff2' }
  ],
  imagenes: { frase: 'frase.png', pin: 'pin.png', zocalo: 'zocalo.png', logo: 'logo.png' },
  muestra: { file: 'foto-muestra.jpg', ox: 0, oy: 0 },

  secciones: [
    { titulo: 'Paquete', campos: [
      { id: 'showFrase', label: 'Mostrar "Viví el encanto de:"', tipo: 'check', valor: true },
      { id: 'destino', label: 'Destino', tipo: 'textarea', filas: 2, max: 24, lineas: 2, hint: 'Corto. Máximo 2 líneas (Enter = salto de línea).', valor: 'Maragogi' },
      { id: 'pais', label: 'País o región (va en el pin)', max: 18, valor: 'Brasil' },
      { id: 'fecha', label: 'Fecha / salida (opcional)', max: 20, hint: 'Si la cargás, va arriba de la lista en negrita.', valor: '' },
      { id: 'incluye', label: 'Qué incluye', tipo: 'textarea', filas: 4, max: 80, lineas: 5, hint: 'Un ítem por línea, hasta 5. Ej: Aéreos / 7 Noches / Traslados / Desayuno', valor: 'Aéreos\n7 Noches\nTraslados\nDesayuno' }
    ]},
    { titulo: 'Precio', campos: [
      { id: 'desde', label: 'Texto superior', max: 10, valor: 'desde', medio: true },
      { id: 'moneda', label: 'Moneda', tipo: 'select', opciones: ['usd', 'ars', '$', 'eur'], valor: 'usd', medio: true },
      { id: 'precio', label: 'Precio', max: 10, hint: 'Solo el número. Si hay varios, el más bajo.', valor: '899' },
      { id: 'base', label: 'Aclaración', max: 28, valor: 'por persona - base doble' }
    ]}
  ],
  // Qué campo completa cada dato del ordenador de información (IA)
  ia: { destino: 'destino', pais: 'pais', fecha: 'fecha', incluye: 'incluye', precio: 'precio', moneda: 'moneda', aclaracion: 'base' },

  ajustes: [
    { id: 'luz', label: 'Luz detrás del texto', hint: 'aclara la izquierda de la foto', min: 0, max: 2, step: 0.01, valor: 1 }
  ],

  dibujar(ctx, h) {
    const W = h.W, H = h.H, FONT = "'Titulos AVM'";
    const C = { white: '#F9F7F7', violeta: '#5E2D89', verde: '#013834' };
    const font = (w, s) => `${w} ${s}px ${FONT}`;
    const fit = (t, w, s, maxW) => {
      ctx.font = font(w, s); const m = ctx.measureText(t).width;
      if (m <= maxW) return { size: s, w: m };
      const s2 = s * maxW / m; ctx.font = font(w, s2); return { size: s2, w: ctx.measureText(t).width };
    };
    const rrect = (x, y, w, hh, r) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r);
      ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    const v = h.v;
    const cuadrado = h.formato === 'cuadrado';
    // s = escala del bloque de arriba (frase, destino, pin, lista); ps = escala del precio; zs = escala de ola y logo
    const L = cuadrado
      ? { s: .72, firstBase: 286, listaMin: 0, ps: .64, py: 610, zs: .72, zy: 1080 - 340, logoY: 948 }
      : { s: 1, firstBase: 527, listaMin: 882.6, ps: 1, py: 1205, zs: 1, zy: 1340, logoY: 1606 };
    const s = L.s;

    // 1. Foto y luz suave a la izquierda (como la capa "Luz suave" del PSD)
    h.fondo();
    const k = h.n('luz');
    const g = ctx.createLinearGradient(0, 0, 616, 0);
    g.addColorStop(0, `rgba(223,242,252,${Math.min(1, .35 * k)})`);
    g.addColorStop(1, 'rgba(223,242,252,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 616, cuadrado ? H : 1274);
    ctx.textBaseline = 'alphabetic';

    // 2. Destino (1 o 2 líneas) con la frase arriba
    const lines = v('destino').split('\n').map(x => x.trim()).filter(Boolean);
    let tSize = 185 * s, lead = 160 * s;
    ctx.font = font(900, tSize);
    let maxW = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
    const tope = 940;
    if (maxW > tope) { const f = tope / maxW; tSize *= f; lead *= f; ctx.font = font(900, tSize); maxW = Math.max(...lines.map(l => ctx.measureText(l).width)); }
    h.aviso('destino', tSize < 184.9 * s ? 'El texto es largo: se achicó para que entre.' : '');
    const firstBase = L.firstBase, lastBase = firstBase + lead * (lines.length - 1);
    if (h.on('showFrase')) {
      const fw = 609 * s, fh = 88 * s;
      ctx.drawImage(h.img.frase, 540 + 46.5 * s - fw / 2, firstBase - 198 * s, fw, fh);
    }
    ctx.fillStyle = C.white; ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, 540, firstBase + lead * i));

    // 3. Pin con el país (la etiqueta verde se estira según el texto)
    let abajo = lastBase + 60 * s;
    if (v('pais').trim()) {
      const t = v('pais').trim(), f = fit(t, 500, 66.6 * s, 560 * s);
      const px = 157 * s + (540 - 540 * s), py = lastBase + 19 * s;   // el bloque se centra en 540
      const pillX = px + 79 * s, pillY = py + 30 * s, pillW = f.w + 126 * s, pillH = 72 * s;
      ctx.save(); ctx.translate(pillX, pillY + pillH / 2); ctx.rotate(-1.2 * Math.PI / 180);
      rrect(0, -pillH / 2, pillW, pillH, 14 * s); ctx.fillStyle = C.verde; ctx.fill();
      ctx.font = font(500, f.size); ctx.fillStyle = C.white; ctx.textAlign = 'left';
      ctx.fillText(t, 57 * s, 22 * s);
      ctx.restore();
      ctx.drawImage(h.img.pin, px, py, 112 * s, 132 * s);
      abajo = py + 132 * s;
    }

    // 4. Lista de lo que incluye (un ítem por línea; también acepta "A - B - C")
    const items = v('incluye').split(/\n| - /).map(x => x.trim()).filter(Boolean).slice(0, 5);
    const fecha = v('fecha').trim();
    const lsz = 51.3 * (cuadrado ? .74 : 1), llead = 60 * (cuadrado ? .74 : 1), lx = cuadrado ? 80 : 100;
    let y = Math.max(L.listaMin, abajo + (cuadrado ? 95 : 150) * s);
    // Si no entra antes de la caja del precio, la lista se achica (hasta 70 %) y después sube lo necesario
    const n = items.length + (fecha ? 1 : 0), limite = L.py - (cuadrado ? 30 : 45);
    let ls = 1;
    if (n > 1 && y + (n - 1) * llead > limite) ls = Math.max(.7, (limite - y) / ((n - 1) * llead));
    y = Math.min(y, limite - (n - 1) * llead * ls);
    ctx.textAlign = 'left'; ctx.fillStyle = C.violeta;
    if (fecha) { ctx.font = font(900, fit(fecha, 900, lsz * ls, 520).size); ctx.fillText(fecha, lx, y); y += llead * ls; }
    items.forEach(it => { ctx.font = font(500, fit(it, 500, lsz * ls, 520).size); ctx.fillText(it, lx, y); y += llead * ls; });

    // 5. Ola, logo y precio
    const zs = L.zs;
    ctx.drawImage(h.img.zocalo, 525 - 701 * zs, L.zy, 1402 * zs, 580 * zs);
    ctx.drawImage(h.img.logo, 538 - 344 * zs, L.logoY, 688 * zs, 168 * zs);

    const p = v('precio').trim();
    if (p) {
      const ps = L.ps, Y = L.py, mon = v('moneda');
      const nSize = 156 * ps, mSize = 113.6 * ps;
      ctx.font = font(900, nSize); let wn = ctx.measureText(p).width;
      ctx.font = font(900, mSize); let wm = ctx.measureText(' ' + mon).width;
      let k2 = Math.min(1, (900 - 44 * ps) / (wn + wm));   // si no entra ni estirando la caja, se achica
      const x0 = 44 * ps, textR = x0 + (wn + wm) * k2;
      const boxR = Math.max(550 * ps, textR + 29 * ps);
      rrect(-87, Y, boxR + 87, 240 * ps, 50 * ps); ctx.fillStyle = C.violeta; ctx.fill();
      ctx.fillStyle = C.white; ctx.textAlign = 'left';
      ctx.font = font(900, nSize * k2); ctx.fillText(p, x0, Y + 160 * ps);
      ctx.font = font(900, mSize * k2); ctx.fillText(' ' + mon, x0 + wn * k2, Y + 160 * ps);
      ctx.textAlign = 'right'; ctx.font = font(500, 67 * ps); ctx.fillText(v('desde'), textR, Y + 63 * ps);
      ctx.textAlign = 'center'; const fb = fit(v('base'), 500, 41 * ps, boxR - 40 * ps);
      ctx.font = font(500, fb.size); ctx.fillText(v('base'), (x0 + textR) / 2, Y + 201 * ps);
    }
  }
};
