/* ============================================
   Kickstart Marketing — movimiento del sitio
   Sin librerías. Si este archivo falla, la página se ve completa y quieta.
   ============================================ */
(function(){
  document.documentElement.classList.add('ready');
  var RM =window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Revelado al hacer scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !RM){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -8% 0px'});
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('in'); });
  }
  // Las tarjetas de una misma grilla entran escalonadas
  document.querySelectorAll('[data-stagger]').forEach(function(g){
    Array.prototype.forEach.call(g.children, function(c, i){ c.style.setProperty('--rd', (i * 0.09) + 's'); });
  });

  /* ---------- Números que cuentan (casos de éxito) ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function countUp(el){
    var raw = el.getAttribute('data-count'), m = raw.match(/^(\D*)(\d+)(\D*)$/);
    if (!m || RM){ el.textContent = raw; return; }
    var end = +m[2], t0 = null, dur = 1400;
    function step(t){
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = m[1] + Math.round(end * e) + m[3];
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length){
    if ('IntersectionObserver' in window){
      var co = new IntersectionObserver(function(es){
        es.forEach(function(e){ if (e.isIntersecting){ countUp(e.target); co.unobserve(e.target); } });
      }, {threshold:.6});
      counters.forEach(function(el){ co.observe(el); });
    }
  }

  /* ---------- Efectos de mouse (solo con mouse, no en celular) ---------- */
  if (FINE && !RM){
    document.querySelectorAll('[data-glow]').forEach(function(c){
      c.addEventListener('pointermove', function(e){
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Portada: el "puntapié" ---------- */
  var hero = document.querySelector('[data-hero]');
  if (!hero) return;
  var timers = [];
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }

  // Cada palabra del título sale de su propia máscara
  hero.querySelectorAll('[data-words]').forEach(function(h){
    var n = 0;
    (function wrap(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(c){
        if (c.nodeType === 3){
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(t){
            if (!t) return;
            if (/^\s+$/.test(t)){ frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'mask';
            var i = document.createElement('span'); i.textContent = t;
            i.style.transitionDelay = (0.55 + n++ * 0.06) + 's';
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains('sr-only')){ wrap(c); }
      });
    })(h);
  });

  // La palabra gigante ocupa justo el ancho disponible, sin cortarse
  function fit(){
    hero.querySelectorAll('.word .w').forEach(function(w){
      if (!w.offsetWidth) return;
      w.style.fontSize = '';
      var max = hero.clientWidth * 0.94, real = w.scrollWidth;
      if (real > max) w.style.fontSize = (parseFloat(getComputedStyle(w).fontSize) * max / real) + 'px';
    });
  }

  // Cada letra se sacude según su distancia al centro: el golpe sale de Kicki
  hero.querySelectorAll('.word .w').forEach(function(w){
    var s = w.children, mid = (s.length - 1) / 2;
    for (var i = 0; i < s.length; i++){
      s[i].style.transitionDelay = (0.15 + i * 0.05) + 's';
      s[i].style.setProperty('--jd', (Math.abs(i - mid) * 0.045) + 's');
      s[i].style.setProperty('--jr', ((i - mid) * 1.4) + 'deg');
    }
  });
  var kicki = hero.querySelector('.kicki-hero'), badge = hero.querySelector('.badge');
  if (kicki) kicki.style.transitionDelay = '.6s';
  if (badge) badge.style.transitionDelay = '.85s';
  hero.querySelectorAll('[data-hero-in]').forEach(function(el, i){ el.style.transitionDelay = (0.8 + i * 0.1) + 's'; });

  var cta = hero.querySelector('.btn-primary');
  function play(){
    timers.forEach(clearTimeout); timers = [];
    fit();
    if (RM){ hero.classList.add('go'); return; }
    later(function(){ hero.classList.add('go'); }, 60);       // letras y textos suben
    later(function(){ hero.classList.add('kick'); }, 1100);   // Kicki aterriza: el cuadrado late y las letras se sacuden
    later(function(){ if (cta) cta.classList.add('shine'); }, 1800);
  }
  // Un toque saltea la intro
  hero.addEventListener('pointerdown', function(){ timers.forEach(clearTimeout); timers = []; hero.classList.add('go'); });
  addEventListener('resize', fit);

  // Profundidad suave: Kicki y la palabra se mueven en sentidos opuestos
  if (FINE && !RM){
    var kimg = hero.querySelector('.kicki-hero img'), word = hero.querySelector('.word'), raf = 0;
    hero.addEventListener('pointermove', function(e){
      if (raf) return;
      raf = requestAnimationFrame(function(){
        raf = 0;
        var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        if (kimg) kimg.style.transform = 'translate(' + (x * 14) + 'px,' + (y * 8) + 'px)';
        if (word) word.style.transform = 'translate(' + (x * -10) + 'px,' + (y * -5) + 'px)';
      });
    });
  }

  if (document.fonts && document.fonts.ready){
    Promise.race([document.fonts.ready, new Promise(function(r){ setTimeout(r, 1200); })]).then(play);
  } else { play(); }
})();
