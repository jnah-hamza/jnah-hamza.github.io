/* =========================================================
   Fonctions partagées (page d'accueil + pages projets)
   ========================================================= */
(function () {
  'use strict';

  var BASE = window.HJ_BASE || '';
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

  var HJ = window.HJ = {
    base: BASE,
    reduce: mqReduce.matches,
    fine: mqFine.matches,
    isMobile: function () { return window.innerWidth < 768; },
    site: fetch(BASE + 'data/site.json').then(function (r) { return r.json(); })
  };
  mqReduce.addEventListener && mqReduce.addEventListener('change', function (e) { HJ.reduce = e.matches; });
  if (HJ.reduce) document.documentElement.classList.add('reduce');

  /* ---------- Aléatoire reproductible (pour des bords déchirés stables) ---------- */
  HJ.rand = function (seed) {
    var s = seed || 1;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  };

  /* ---------- Bords de papier déchiré (SVG irréguliers, différents à chaque section) ---------- */
  HJ.torn = function (root) {
    (root || document).querySelectorAll('.torn').forEach(function (el) {
      if (el.firstChild) return;
      var seed = parseInt(el.getAttribute('data-seed') || '5', 10);
      var r = HJ.rand(seed * 977);
      var top = el.classList.contains('torn--top');
      var W = 1440, H = 60, x = 0, pts = [];
      while (x < W) {
        var base = 18 + r() * 16;
        if (r() < 0.12) base += 12 + r() * 14; // grandes déchirures
        pts.push([x, base]);
        x += 6 + r() * 26;
      }
      pts.push([W, 22 + r() * 10]);
      function line(off) {
        return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + (p[1] + off).toFixed(1); }).join(' ');
      }
      var d, d2;
      if (top) {
        // Haut plein, bas déchiré
        d ='M0 0 L' + W + ' 0 ' + pts.slice().reverse().map(function (p) { return 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + ' Z';
        d2 = 'M0 0 L' + W + ' 0 ' + pts.slice().reverse().map(function (p) { return 'L' + p[0].toFixed(1) + ' ' + (p[1] + 3 + r() * 3).toFixed(1); }).join(' ') + ' Z';
      } else {
        d = line(0) + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
        d2 = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + (p[1] - 3 - r() * 3).toFixed(1); }).join(' ') + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
      }
      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        '<path class="torn__fiber" d="' + d2 + '"/><path class="torn__fill" d="' + d + '"/></svg>';
    });
  };

  /* ---------- Bandeaux qui défilent ---------- */
  HJ.marquees = function () {
    document.querySelectorAll('[data-marquee]').forEach(function (el) {
      var word = (I18N.t(el.getAttribute('data-marquee')) || '').toUpperCase();
      var unit = '';
      for (var i = 0; i < 8; i++) unit += '<span>' + I18N.esc(word) + '</span><span class="marquee__star">✦✦✦</span>';
      el.innerHTML = '<div class="marquee__half">' + unit + '</div><div class="marquee__half">' + unit + '</div>';
    });
  };

  /* ---------- Titres qui apparaissent lettre par lettre ---------- */
  HJ.letters = function (root) {
    (root || document).querySelectorAll('.reveal-letters').forEach(function (el) {
      el.__letters = function (text) {
        el.setAttribute('aria-label', text);
        var i = 0;
        el.innerHTML = text.split(' ').map(function (w) {
          return '<span class="w" aria-hidden="true">' + Array.from(w).map(function (c) {
            return '<span class="l" style="--i:' + (i++) + '">' + I18N.esc(c) + '</span>';
          }).join('') + '</span>';
        }).join(' ');
        if (el.classList.contains('sel')) el.insertAdjacentHTML('beforeend', '<i class="sel__h" aria-hidden="true"></i><i class="sel__h" aria-hidden="true"></i>');
      };
      el.__letters(el.textContent.trim());
    });
  };

  /* ---------- Apparition au défilement ---------- */
  var io = null;
  HJ.observe = function (root) {
    var els = (root || document).querySelectorAll('.reveal, .reveal-letters, .rv, .timeline__item, .draw-on-scroll');
    if (!('IntersectionObserver' in window) || HJ.reduce) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  };
  /* Sécurité : tout s'affiche même si une animation ne se lance pas */
  setTimeout(function () {
    document.querySelectorAll('.reveal-letters:not(.is-in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('is-in');
    });
  }, 4000);

  /* ---------- Parallaxe légère ---------- */
  var parallaxBound = false;
  HJ.parallax = function () {
    if (HJ.reduce || parallaxBound) return;
    parallaxBound = true;
    var ticking = false;
    function update() {
      ticking = false;
      var els = document.querySelectorAll('[data-parallax]');
      if (window.innerWidth < 768) { els.forEach(function (el) { el.style.removeProperty('--py'); }); return; }
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var c = (r.top + r.height / 2 - vh / 2);
        el.style.setProperty('--py', (-c * parseFloat(el.getAttribute('data-parallax'))).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  /* ---------- Curseur personnalisé (ordinateur uniquement) ---------- */
  HJ.cursor = function () {
    var c = document.querySelector('.cursor');
    if (!c || !HJ.fine || HJ.reduce) return;
    document.documentElement.classList.add('has-cursor');
    var x = -100, y = -100, cx = x, cy = y;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      var hot = e.target.closest && e.target.closest('a, button, [role="button"], label, input, textarea, .polaroid, canvas');
      c.classList.toggle('is-hot', !!hot);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.add('is-out'); });
    document.addEventListener('pointerenter', function () { c.classList.remove('is-out'); });
    (function loop() {
      cx += (x - cx) * 0.25; cy += (y - cy) * 0.25;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  };

  /* ---------- En-tête + menu plein écran ---------- */
  HJ.header = function () {
    var header = document.getElementById('header');
    var burger = document.querySelector('.burger');
    var menu = document.getElementById('menu');
    if (header) {
      var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (!burger || !menu) return;
    function close(focusBack) {
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('menu-open');
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 350);
      burger.setAttribute('aria-label', I18N.t('common.menu') || 'Menu');
      if (focusBack) burger.focus();
    }
    function open() {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', I18N.t('common.close') || 'Fermer');
      document.documentElement.classList.add('menu-open');
      var first = menu.querySelector('a');
      if (first) setTimeout(function () { first.focus(); }, 50);
    }
    burger.addEventListener('click', function () {
      burger.getAttribute('aria-expanded') === 'true' ? close(false) : open();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) close(true);
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1240 && menu.classList.contains('is-open')) close(false); });
  };

  /* ---------- Visionneuse plein écran (photos) ---------- */
  HJ.lightbox = (function () {
    var box, img, cap, count, items = [], idx = 0, lastFocus = null, tx = null;
    function render() {
      var it = items[idx];
      img.src = it.src;
      img.alt = it.alt || '';
      cap.innerHTML = it.caption || '';
      count.textContent = (idx + 1) + ' / ' + items.length;
      // Précharge la suivante
      if (items.length > 1) { var n = new Image(); n.src = items[(idx + 1) % items.length].src; }
    }
    function go(d) { idx = (idx + d + items.length) % items.length; render(); }
    function close() {
      box.classList.remove('is-open');
      document.documentElement.classList.remove('lb-open');
      setTimeout(function () { box.hidden = true; img.removeAttribute('src'); }, 250);
      if (lastFocus) lastFocus.focus();
    }
    function init() {
      box = document.getElementById('lightbox');
      if (!box) return false;
      img = document.getElementById('lightbox-img');
      cap = document.getElementById('lightbox-cap');
      count = document.getElementById('lightbox-count');
      box.querySelector('.lightbox__close').addEventListener('click', close);
      box.querySelector('.lightbox__prev').addEventListener('click', function () { go(-1); });
      box.querySelector('.lightbox__next').addEventListener('click', function () { go(1); });
      box.addEventListener('click', function (e) { if (e.target === box) close(); });
      document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'Tab') {
          var f = Array.from(box.querySelectorAll('button, a'));
          var i = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });
      box.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (tx == null) return;
        var dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
        tx = null;
      });
      return true;
    }
    var ready = false;
    return {
      open: function (list, i) {
        if (!ready) ready = init();
        if (!ready || !list.length) return;
        items = list; idx = i || 0; lastFocus = document.activeElement;
        box.hidden = false;
        document.documentElement.classList.add('lb-open');
        render();
        requestAnimationFrame(function () { box.classList.add('is-open'); });
        box.querySelector('.lightbox__close').focus();
      }
    };
  })();

  /* ---------- Vérifie qu'un fichier existe (PDF, images à venir) ---------- */
  HJ.exists = function (url) {
    if (!url) return Promise.resolve(false);
    return fetch(BASE + url, { method: 'HEAD' }).then(function (r) { return r.ok; }).catch(function () { return false; });
  };

  /* ---------- Polaroïd ---------- */
  HJ.polaroid = function (o) {
    // o: {thumb, full, alt, caption, w, h, tilt, size, placeholder}
    var land = o.w && o.h ? o.w > o.h * 1.15 : false;
    var tilt = o.tilt != null ? o.tilt : 0;
    var inner = o.placeholder
      ? '<span class="polaroid__ph">' + I18N.html(o.placeholder) + '</span>'
      : '<img src="' + o.thumb + '" alt="' + I18N.esc(o.alt || '') + '" loading="lazy" decoding="async"' +
        (o.w ? ' width="' + o.w + '" height="' + o.h + '"' : '') + '>';
    var tag = o.button ? 'button type="button"' : 'figure';
    var end = o.button ? 'button' : 'figure';
    return '<' + tag + ' class="polaroid rv ' + (land ? 'polaroid--land ' : 'polaroid--tall ') + (o.size ? 'polaroid--' + o.size : '') +
      '" style="--tilt:' + tilt + 'deg"' + (o.index != null ? ' data-index="' + o.index + '"' : '') + '>' +
      '<span class="polaroid__img">' + inner + '</span>' +
      '<span class="polaroid__cap">' + I18N.html(o.caption || '') + '</span></' + end + '>';
  };

  /* ---------- Page « carnet de croquis » : notes, flèches et cercles qui se dessinent ---------- */
  HJ.sketchSVG = function (k) {
    var tx = function (key) { return I18N.esc(I18N.t(k + key)); };
    var P = function (d, cls, delay) { return '<path pathLength="1" class="ink ' + (cls || '') + '" style="--dl:' + (delay || 0) + 's" d="' + d + '"/>'; };
    return '<figure class="sketch draw-on-scroll" role="img" aria-label="' + I18N.esc(I18N.t('sketch.paper_alt')) + '">' +
      '<svg viewBox="0 0 700 640" aria-hidden="true" focusable="false">' +
        '<text x="34" y="66" class="sk-title">' + tx('title') + '</text>' +
        P('M34 80 C 140 90, 260 74, 400 84', 'red', 0.1) +
        '<text x="350" y="318" text-anchor="middle" class="sk-logo">' + tx('center') + '</text>' +
        P('M175 300 C 172 250, 270 222, 360 224 C 470 226, 528 262, 522 304 C 516 352, 420 378, 340 376 C 240 374, 168 346, 182 296', 'red', 0.3) +
        '<text x="500" y="160" text-anchor="middle" class="sk-note">' + tx('n1') + '</text>' +
        P('M496 176 C 486 196, 458 214, 426 228 M426 228 l14 -2 M426 228 l6 -12', '', 0.6) +
        '<text x="34" y="182" class="sk-note">' + tx('n2') + '</text>' +
        P('M120 196 C 140 226, 170 250, 206 266 M206 266 l-8 -12 M206 266 l-14 2', '', 0.8) +
        '<text x="34" y="478" class="sk-note">' + tx('n3') + '</text>' +
        P('M110 450 C 140 410, 180 372, 222 352 M222 352 l-14 0 M222 352 l-4 13', '', 1.0) +
        '<text x="520" y="452" text-anchor="middle" class="sk-note">' + tx('n4') + '</text>' +
        P('M506 424 C 496 398, 486 378, 470 360 M470 360 l2 14 M470 360 l13 5', '', 1.2) +
        '<text x="350" y="412" text-anchor="middle" class="sk-note sk-note--red">' + tx('n7') + '</text>' +
        '<text x="34" y="586" class="sk-note">' + tx('n5') + '</text>' +
        P('M34 600 C 90 610, 160 594, 250 604', 'red', 1.4) +
        '<text x="666" y="604" text-anchor="end" class="sk-note">' + tx('n6') + '</text>' +
        P('M606 468 h40 l12 12 v72 h-52 Z M646 468 v12 h12 M616 496 h32 M616 510 h32 M616 524 h22', '', 1.6) +
        P('M70 120 l10 10 M80 120 l-10 10', 'red', 1.7) +
        P('M640 60 c 6 -10, 16 -10, 20 0 c 4 10, -12 18, -20 8', '', 1.8) +
      '</svg></figure>';
  };

  HJ.boot = function (after) {
    HJ.torn();
    HJ.header();
    HJ.cursor();
    I18N.onChange(function () { HJ.marquees(); });
    HJ.letters();
    I18N.init().then(function () {
      HJ.observe();
      HJ.parallax();
      if (after) after();
    });
  };
})();
