/* =========================================================
   Page d'accueil : construit les sections à partir de
   data/site.json (liens, images) et lang/*.json (textes)
   ========================================================= */
(function () {
  'use strict';

  var SITE = null;
  var t = function (k, v) { return I18N.t(k, v); };
  var h = function (s) { return I18N.html(s); };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* Photo de parcours (événements, projets) en polaroïd */
  function pola(p, caption, tilt, size, i) {
    return HJ.polaroid({
      thumb: 'assets/img/' + p.folder + '/thumbs/' + p.file + '.webp', alt: caption,
      caption: caption, tilt: tilt, size: size, w: p.w, h: p.h, button: true, index: i
    });
  }
  /* Clic sur un polaroïd : plein écran avec toutes les photos du même groupe */
  function bindGallery(root, photos, captionOf) {
    root.querySelectorAll('.polaroid[data-index]').forEach(function (b) {
      b.addEventListener('click', function () {
        HJ.lightbox.open(photos.map(function (p) {
          var c = captionOf(p);
          return { src: 'assets/img/' + p.folder + '/' + p.file + '.webp', alt: c, caption: I18N.esc(c) };
        }), parseInt(b.getAttribute('data-index'), 10));
      });
    });
  }
  function logo(src, alt, cls) {
    return src ? '<span class="logo-chip ' + (cls || '') + '"><img src="' + src + '" alt="' + I18N.esc(alt || '') + '" loading="lazy"></span>' : '';
  }

  /* ---------- Projets : cartes simples, entièrement cliquables ---------- */
  function projectCard(p, i) {
    var k = 'projects.items.' + p.id;
    var year = t(k + '.year');
    var cover = p.cover ? '<img src="' + p.cover + '" alt="" loading="lazy">' : '<span class="tile__pattern" aria-hidden="true"></span>';
    return '<article class="pcard pcard--' + p.id + (p.cover ? ' has-cover' : '') + '" style="--d:' + (i * 120) + 'ms" data-card="' + p.id + '">' +
      '<div class="pcard__media">' + cover + '<span class="tile__num">0' + (i + 1) + '</span></div>' +
      '<div class="pcard__body">' +
        '<p class="pcard__meta"><span class="chip chip--red">' + h(t('projects.categories.' + p.category)) + '</span>' + (I18N.clean(year) ? '<span class="chip">' + h(year) + '</span>' : '') + '</p>' +
        '<h3 class="pcard__title"><span class="glitch" data-text="' + I18N.esc(I18N.clean(t(k + '.title'))) + '">' + h(t(k + '.title')) + '</span></h3>' +
        '<p class="pcard__tagline">' + h(t(k + '.tagline')) + '</p>' +
        '<a class="pcard__more" href="projet.html?id=' + p.id + '" data-project="' + p.id + '">' + h(t('projects.open')) + ' <span aria-hidden="true">→</span></a>' +
      '</div></article>';
  }
  function renderProjects() {
    var track = $('#projects-track');
    track.innerHTML = SITE.projects.map(projectCard).join('');
    HJ.observe(track);
    setupHScroll();
  }

  /* Fenêtre pop-up d'un projet : s'ouvre depuis la carte, garde la position de défilement */
  var modal = { open: null, last: null, y: 0, card: null };
  function setupModal() {
    var box = $('#pmodal'), content = $('#pmodal-content'), inner = $('#pmodal-box');
    function lock() {
      modal.y = window.scrollY;
      document.body.style.top = -modal.y + 'px';
      document.documentElement.classList.add('modal-open');
    }
    function unlock() {
      document.documentElement.classList.remove('modal-open');
      document.body.style.top = '';
      var y = modal.y;
      window.scrollTo({ top: y, behavior: 'instant' });
      requestAnimationFrame(function () { if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' }); });
      setTimeout(function () { if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' }); }, 120);
    }
    function flipFrom(card) {
      if (!card || HJ.reduce) return;
      var r = card.getBoundingClientRect(), f = inner.getBoundingClientRect();
      if (!r.width || !f.width) return;
      inner.style.transition = 'none';
      inner.style.transformOrigin = 'top left';
      inner.style.transform = 'translate(' + (r.left - f.left) + 'px,' + (r.top - f.top) + 'px) scale(' + (r.width / f.width) + ',' + (r.height / f.height) + ')';
      inner.style.opacity = '0.6';
      void inner.offsetWidth;
      inner.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1), opacity .3s';
      inner.style.transform = 'none';
      inner.style.opacity = '1';
    }
    function fill(id) {
      var P = SITE.projects.filter(function (p) { return p.id === id; })[0];
      if (!P) return false;
      modal.open = id;
      content.innerHTML = HJ.projectHTML(P, SITE.projects, '');
      HJ.bindProject(content);
      inner.scrollTop = 0;
      return true;
    }
    function show(id, card) {
      var first = !modal.open;
      if (!fill(id)) return;
      if (first) {
        lock();
        box.hidden = false;
        box.classList.add('is-open');
        flipFrom(card);
      }
      inner.focus({ preventScroll: true });
    }
    function close() {
      if (!modal.open) return;
      modal.open = null;
      box.classList.remove('is-open');
      inner.style.transition = ''; inner.style.transform = ''; inner.style.opacity = '';
      setTimeout(function () { box.hidden = true; content.innerHTML = ''; }, 250);
      unlock();
      if (modal.last) { modal.restoring = true; modal.last.focus({ preventScroll: true }); setTimeout(function () { modal.restoring = false; }, 50); }
    }
    modal.show = show;
    modal.isRestoring = function () { return modal.restoring; };
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-project]');
      var card = e.target.closest('[data-card]');
      if (!a && !card) return;
      var id = a ? a.getAttribute('data-project') : card.getAttribute('data-card');
      e.preventDefault();
      if (!modal.open) modal.last = (card && card.querySelector('[data-project]')) || a;
      show(id, card);
    });
    box.querySelector('.pmodal__close').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!modal.open || !document.getElementById('lightbox').hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'Tab') {
        var f = Array.from(box.querySelectorAll('a[href], button:not([disabled]), iframe, [tabindex="0"]')).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === inner)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    I18N.onChange(function () { if (modal.open) fill(modal.open); });
  }

  /* ---------- Projets : l'enveloppe ----------
     Ordinateur : section épinglée, le cachet se brise, le rabat s'ouvre, les projets
     sortent un par un et se posent en éventail (lié au défilement, réversible).
     Téléphone : l'enveloppe s'ouvre toute seule, les cartes s'empilent en colonne.
     Animations coupées : enveloppe ouverte, cartes visibles.                        */
  var env = { bound: false };
  function clamp01(x) { return Math.min(1, Math.max(0, x)); }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function setupHScroll() { setupEnvelope(); }
  function setupEnvelope() {
    var wrap = $('#env-scrolly'), stage = $('#env-stage'), box = $('#env'), track = $('#projects-track');
    if (!wrap) return;
    var front = box.querySelector('.env__front'), flap = box.querySelector('.env__flap'), seal = box.querySelector('.env__seal');
    function pinned() { return window.innerWidth >= 900 && !HJ.reduce; }
    env.layout = function () {
      env.pin = pinned();
      wrap.classList.toggle('is-pinned', env.pin);
      wrap.classList.toggle('is-list', !env.pin);
      if (env.pin) {
        if (track.parentNode !== box) box.insertBefore(track, front);
        var vh = window.innerHeight;
        var EW = Math.min(600, window.innerWidth * 0.46, (vh - 120) * 1.15);
        var EH = EW * 0.62, CW = EW * 0.38, CH = CW * 1.34;
        env.g = { EW: EW, EH: EH, CW: CW, CH: CH, vh: vh };
        box.style.width = EW + 'px'; box.style.height = EH + 'px';
        track.querySelectorAll('.pcard').forEach(function (c) { c.style.width = CW + 'px'; c.style.height = CH + 'px'; c.style.left = ((EW - CW) / 2) + 'px'; c.style.top = (EH * 0.1) + 'px'; });
        env.update();
      } else {
        if (track.parentNode !== stage) stage.appendChild(track);
        box.style.width = ''; box.style.height = ''; box.style.transform = '';
        track.querySelectorAll('.pcard').forEach(function (c) { c.style.cssText = c.style.cssText.replace(/(width|height|left|top|transform|z-index)[^;]*;?/g, ''); });
        flap.style.transform = ''; seal.style.cssText = '';
        if (HJ.reduce) wrap.classList.add('is-open');
      }
      env.update && env.update();
    };
    env.update = function () {
      if (!env.pin) {
        // Téléphone : s'ouvre dès que l'enveloppe arrive à l'écran (ou si on est déjà plus bas)
        if (!wrap.classList.contains('is-open') && wrap.getBoundingClientRect().top < window.innerHeight * 0.7) wrap.classList.add('is-open');
        return;
      }
      var r = wrap.getBoundingClientRect();
      var total = wrap.offsetHeight - window.innerHeight;
      var p = clamp01(-r.top / Math.max(1, total));
      var g = env.g;
      // 1) le cachet se brise
      var ks = ease(clamp01((p - 0.04) / 0.12));
      seal.style.setProperty('--k', ks.toFixed(3));
      // 2) le rabat s'ouvre en 3D
      var kf = ease(clamp01((p - 0.14) / 0.18));
      flap.style.transform = 'rotateX(' + (kf * 178).toFixed(1) + 'deg)';
      box.classList.toggle('flap-open', kf > 0.5);
      // 3) l'enveloppe descend pour laisser la place à l'éventail
      var kd = ease(clamp01((p - 0.3) / 0.25));
      var y0 = (g.vh - g.EH) / 2 + 20, y1 = g.vh - g.EH - 24;
      box.style.transform = 'translateY(' + ((y1 - y0) * kd).toFixed(1) + 'px)';
      stage.style.setProperty('--env-top', y0 + 'px');
      // 4) les projets sortent un par un puis se posent en éventail
      var cards = track.querySelectorAll('.pcard'), n = cards.length;
      cards.forEach(function (c, i) {
        var start = 0.34 + i * 0.13;
        var k1 = ease(clamp01((p - start) / 0.16));
        var k2 = ease(clamp01((p - start - 0.12) / 0.2));
        var mid = i - (n - 1) / 2;
        var ty = -k1 * g.CH * 0.98 - k2 * g.EH * 0.18;
        var tx = k2 * mid * g.CW * 1.12;
        var rot = k2 * mid * 6;
        var sc = 1 + k2 * 0.1;
        c.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        c.classList.toggle('is-out', k1 > 0.8);
        c.style.visibility = kf > 0.55 ? '' : 'hidden';
        c.style.zIndex = k1 > 0.8 ? String(10 + i) : '';
      });
      stage.classList.toggle('is-done', p > 0.97);
      stage.classList.toggle('is-start', p < 0.03);
    };
    if (!env.bound) {
      env.bound = true;
      window.addEventListener('scroll', function () { requestAnimationFrame(env.update); }, { passive: true });
      window.addEventListener('resize', function () { requestAnimationFrame(env.layout); });
      setTimeout(env.update, 300);
    }
    env.layout();
  }

  /* ---------- Expériences ---------- */
  function renderExperience() {
    var items = t('experience.items') || [];
    $('#timeline').innerHTML = items.map(function (e, i) {
      var d = (SITE.experience || [])[i] || {};
      return '<li class="timeline__item" style="--d:' + (i * 120) + 'ms">' +
        '<span class="timeline__dot" aria-hidden="true"></span>' +
        '<div class="timeline__card">' +
          '<div class="timeline__logo">' + logo(d.logo, d.logo_alt, 'logo-chip--xxl') + '</div>' +
          '<p class="timeline__date">' + h(e.date) + '</p>' +
          '<h3 class="timeline__role">' + h(e.role) + '</h3>' +
          '<p class="timeline__org"><strong>' + h(e.org) + '</strong> · ' + h(e.place) + '</p>' +
          '<ul class="timeline__points">' + e.points.map(function (p) { return '<li>' + h(p) + '</li>'; }).join('') + '</ul>' +
          '<p class="timeline__tags">' + (e.tags || []).map(function (x) { return '<span class="chip">' + h(x) + '</span>'; }).join('') + '</p>' +
        '</div></li>';
    }).join('');
    var dd = SITE.double_degree || [];
    $('#edu-double').innerHTML = dd.length === 2 ? '<span class="edu-double__lbl">' + h(t('experience.double')) + '</span>' +
      '<span class="edu-double__pair">' + logo(dd[0][0], dd[0][1], 'logo-chip--xl') + '<span class="edu-double__x" aria-hidden="true">×</span>' + logo(dd[1][0], dd[1][1], 'logo-chip--xl') + '</span>' +
      '<span class="edu-double__names">' + I18N.esc(dd[0][1]) + ' × ' + I18N.esc(dd[1][1]) + '</span>' : '';
    $('#education').innerHTML = (t('experience.education') || []).map(function (j, i) {
      var d = (SITE.education || [])[i] || {};
      return '<li class="edu-step rv" style="--d:' + (i * 140) + 'ms">' +
        '<span class="edu-step__dot" aria-hidden="true"></span>' +
        '<div class="edu-step__logo">' + logo(d.logo, d.logo_alt, 'logo-chip--xl') + '</div>' +
        '<div class="edu-step__body"><p class="edu-step__date">' + h(j.date) + '</p><h4 class="edu-step__deg">' + h(j.degree) + '</h4><p class="edu-step__school">' + h(j.school) + '</p>' +
        (j.note ? '<p class="edu-step__note">' + h(j.note) + '</p>' : '') + '</div></li>';
    }).join('');
    HJ.observe($('#experiences'));
    timelineProgress();
  }
  var tlBound = false;
  function timelineProgress() {
    if (tlBound) return; tlBound = true;
    var tl = $('#timeline');
    function up() {
      var r = tl.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
      tl.style.setProperty('--tp', p.toFixed(3));
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(up); }, { passive: true });
    up();
  }

  /* ---------- Jobs étudiants ---------- */
  function renderJobs() {
    $('#jobs-skills').innerHTML = (t('jobs.skills') || []).map(function (x, i) {
      return '<li class="rv" style="--d:' + (i * 90) + 'ms"><span>0' + (i + 1) + '</span>' + h(x) + '</li>';
    }).join('');
    $('#jobs-list').innerHTML = (t('jobs.items') || []).map(function (j, i) {
      var d = (SITE.jobs || [])[i] || {};
      return '<li class="job rv" style="--d:' + (i * 110) + 'ms">' +
        '<div class="job__head">' + logo(d.logo, d.logo_alt, 'logo-chip--lg') + '<p class="job__date hand">' + h(j.date) + '</p></div>' +
        '<h3 class="job__role">' + h(j.role) + '</h3>' +
        (j.org ? '<p class="job__org">' + h(j.org) + '</p>' : '') +
        (j.desc ? '<p class="job__desc">' + h(j.desc) + '</p>' : '') +
        '<span class="job__num" aria-hidden="true">0' + (i + 1) + '</span></li>';
    }).join('');
    HJ.observe($('#jobs'));
  }

  /* ---------- Vidéos ---------- */
  function renderVideos() {
    var items = t('video.items') || [];
    $('#videos').innerHTML = SITE.videos.filter(function (v) { return v.youtube; }).map(function (v, i) {
      var it = items[i] || {};
      var media = '<button class="yt" type="button" data-yt="' + I18N.esc(v.youtube) + '" aria-label="' + I18N.esc(t('video.play') + ' : ' + I18N.clean(it.title || '')) + '">' +
            '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube) + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">' +
            '<span class="yt__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>' +
            (v.badge ? '<span class="yt__badge">' + h(t('video.' + v.badge)) + '</span>' : '') + '</button>';
      return '<article class="vcard vcard--' + (i + 1) + ' rv" style="--d:' + (i * 100) + 'ms">' +
        '<div class="vcard__media">' + media + '<span class="vcard__rec" aria-hidden="true">● REC</span></div>' +
        '<div class="vcard__body">' +
          '<p class="vcard__num">0' + (i + 1) + '</p>' +
          '<h3 class="vcard__title">' + h(it.title) + '</h3>' +
          '<p class="vcard__poem hand">' + h(it.poem) + '</p>' +
          '<p class="vcard__credit">' + h(t('video.' + v.credit)) + '</p>' +
        '</div></article>';
    }).join('');
    HJ.observe($('#videos'));
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.yt[data-yt]');
    if (!b) return;
    var id = b.getAttribute('data-yt');
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    f.title = b.getAttribute('aria-label') || 'YouTube';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    f.className = 'yt__frame';
    b.replaceWith(f);
    f.focus();
  });

  /* ---------- Parascolaire ---------- */
  function capOf(p) { return t('extra.captions.' + p.file); }
  /* Mosaïque : colonnes qui se remplissent sans trou, sans recadrer les photos */
  function mosaic(photos) {
    return '<div class="mosaic mosaic--' + Math.min(photos.length, 5) + '">' + photos.map(function (p, i) {
      var c = capOf(p);
      return '<button type="button" class="mosaic__item rv" style="--d:' + (i * 80) + 'ms" data-index="' + i + '">' +
        '<img src="assets/img/' + p.folder + '/thumbs/' + p.file + '.webp" alt="' + I18N.esc(c) + '" loading="lazy" width="' + p.w + '" height="' + p.h + '">' +
        (c ? '<span class="mosaic__cap">' + I18N.esc(c) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function bindMosaic(root, photos) {
    root.querySelectorAll('.mosaic__item[data-index]').forEach(function (b) {
      b.addEventListener('click', function () {
        HJ.lightbox.open(photos.map(function (p) { var c = capOf(p); return { src: 'assets/img/' + p.folder + '/' + p.file + '.webp', alt: c, caption: I18N.esc(c) }; }), parseInt(b.getAttribute('data-index'), 10));
      });
    });
  }
  function ext(url, label, cls) {
    return url ? '<a class="btn ' + (cls || 'btn--red') + '" href="' + url + '" target="_blank" rel="noopener">' + h(label) + ' ↗<span class="sr-only"> ' + h(t('common.new_tab')) + '</span></a>' : '';
  }
  function renderClubLogos() {
    var list = SITE.club_logos || [];
    $('#club-logos').innerHTML = '<p class="club-logos__lbl">' + h(t('extra.logos_label')) + '</p><ul>' +
      list.map(function (l, i) {
        var inner = logo(l.logo, l.name, 'logo-chip--xl') + '<span class="club-logos__name">' + I18N.esc(l.name) + '</span>';
        return '<li class="rv" style="--d:' + (i * 70) + 'ms">' + (l.photo ? '<button type="button" class="club-logos__btn" data-photo="' + i + '">' + inner + '<span class="club-logos__eye" aria-hidden="true">📷</span></button>' : '<span class="club-logos__btn">' + inner + '</span>') + '</li>';
      }).join('') + '</ul>';
    $('#club-logos').querySelectorAll('[data-photo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = list[+b.getAttribute('data-photo')].photo, c = capOf(p);
        HJ.lightbox.open([{ src: 'assets/img/' + p.folder + '/' + p.file + '.webp', alt: c, caption: I18N.esc(c) }], 0);
      });
    });
    HJ.observe($('#club-logos'));
  }


  /* Bulles façon « écran d'accueil Apple Watch » : nid d'abeille, grandes au centre
     (ou près de la souris), petites aux bords ; on fait glisser pour explorer.       */
  var HEX = [[0, 0], [-1, 0], [1, 0], [-0.5, -0.866], [0.5, -0.866], [-0.5, 0.866], [0.5, 0.866],
             [2, 0], [1.5, -0.866], [1, -1.732], [0, -1.732], [-1, -1.732], [-1.5, -0.866], [-2, 0], [-1.5, 0.866], [-1, 1.732], [0, 1.732], [1, 1.732], [1.5, 0.866]];
  function honey(photos) {
    return '<div class="honey" data-honey>' + photos.map(function (p, i) {
      var c = capOf(p), h = HEX[i % HEX.length];
      return '<button type="button" class="honey__b" data-index="' + i + '" data-hx="' + h[0] + '" data-hy="' + h[1] + '" aria-label="' + I18N.esc(c) + '">' +
        '<img src="assets/img/' + p.folder + '/thumbs/' + p.file + '.webp" alt="" loading="lazy" draggable="false"></button>';
    }).join('') + '</div>';
  }
  function bindHoney(root, photos) {
    var el = root.querySelector('[data-honey]');
    if (!el) return;
    var bs = Array.from(el.querySelectorAll('.honey__b'));
    var pan = { x: 0, y: 0 }, ptr = null, drag = null, moved = 0;
    function layout() {
      var W = el.clientWidth, H = el.clientHeight;
      var D = bs.length > 3 ? Math.min(W / 2.55, H / 1.95) : Math.min(W / 3.1, H / 1.1), step = D * 0.9;
      var reach = Math.min(W, H) * 0.62;
      bs.forEach(function (b) {
        var x = W / 2 + pan.x + parseFloat(b.dataset.hx) * step, y = H / 2 + pan.y + (parseFloat(b.dataset.hy) + (bs.length <= 5 ? 0.43 : 0)) * step;
        var dc = Math.hypot(x - W / 2, y - H / 2);
        var s = 1.08 - Math.min(1, dc / reach) * 0.42;
        if (ptr) { var dp = Math.hypot(x - ptr.x, y - ptr.y); s = Math.max(s, 1.12 - Math.min(1, dp / (D * 1.4)) * 0.6); }
        s = Math.max(0.42, Math.min(1.12, s));
        b.style.width = b.style.height = D + 'px';
        b.style.transform = 'translate(' + (x - D / 2).toFixed(1) + 'px,' + (y - D / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        b.style.zIndex = String(Math.round(s * 100));
      });
    }
    var raf = 0; function req() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; layout(); }); }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      if (HJ.fine) ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (drag) {
        var lim = Math.min(r.width, r.height) * 0.45;
        pan.x = Math.max(-lim, Math.min(lim, drag.px + e.clientX - drag.x));
        pan.y = Math.max(-lim, Math.min(lim, drag.py + e.clientY - drag.y));
        moved = Math.max(moved, Math.hypot(e.clientX - drag.x, e.clientY - drag.y));
      }
      req();
    });
    el.addEventListener('pointerleave', function () { ptr = null; req(); });
    el.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; moved = 0; el.classList.add('is-drag'); });
    window.addEventListener('pointerup', function () { if (drag) { drag = null; el.classList.remove('is-drag'); } });
    bs.forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (moved > 6) { e.preventDefault(); return; }
        HJ.lightbox.open(photos.map(function (p) { var c = capOf(p); return { src: 'assets/img/' + p.folder + '/' + p.file + '.webp', alt: c, caption: I18N.esc(c) }; }), parseInt(b.dataset.index, 10));
      });
    });
    window.addEventListener('resize', req);
    layout();
  }
  var HONEY = { genie: true, green: true };

  function roles(list) {
    return '<ol class="club__roles">' + (list || []).map(function (r, i) {
      return '<li class="rv" style="--d:' + (i * 90) + 'ms"><h4>' + h(r.title) + '</h4>' + (I18N.clean(r.text) ? '<p>' + h(r.text) + '</p>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function renderExtra() {
    var C = 'extra.clubs.';
    var html = (SITE.clubs || []).map(function (c) {
      var k = C + c.id + '.';
      var photos = c.photos || [];
      var inner = '';
      if (c.id === 'epik') {
        var steps = t(k + 'steps') || [];
        var sp = c.steps_photos || [];
        inner = '<ol class="club__steps club__steps--' + steps.length + '">' + steps.map(function (st, i) {
          var ph = sp[i];
          return '<li class="rv" style="--d:' + (i * 160) + 'ms">' +
            (ph ? '<button type="button" class="club__step-photo" data-step-photo="' + i + '"><img src="assets/img/' + ph.folder + '/thumbs/' + ph.file + '.webp" alt="' + I18N.esc(capOf(ph)) + '" loading="lazy" width="' + ph.w + '" height="' + ph.h + '"></button>' : '') +
            '<span class="club__step-n">0' + (i + 1) + '</span>' + (I18N.clean(st.date) ? '<p class="club__step-date">' + h(st.date) + '</p>' : '') + '<h4>' + h(st.title) + '</h4>' + (I18N.clean(st.text) ? '<p>' + h(st.text) + '</p>' : '') + '</li>';
        }).join('') + '</ol>';
      } else {
        inner = roles(t(k + 'roles'));
        var stats = t(k + 'stats') || [];
        if (stats.length) inner += '<ul class="club__stats">' + stats.map(function (x) { return '<li class="rv"><strong>' + h(x.v) + '</strong><span>' + h(x.l) + '</span></li>'; }).join('') + '</ul>';
        var sk = t(k + 'skills') || [];
        if (sk.length) inner += '<p class="club__skills">' + sk.map(function (x) { return '<span class="chip">' + h(x) + '</span>'; }).join('') + '</p>';
        if (c.id === 'aiesec') inner += '<p class="club__network"><span aria-hidden="true">🌍</span> ' + h(t(k + 'network')) + '</p>';
      }
      var extraBlocks = '';
      if (c.id === 'genie') {
        var tt = c.take_taste || {}, rb = c.rebirth || {};
        extraBlocks =
          '<div class="subcard ttcard rv" data-g="tt"><div class="subcard__text">' +
            '<p class="xcard__date">' + h(t('extra.tt.label')) + ' · ' + h(t('extra.tt.date')) + '</p>' +
            '<h4 class="subcard__title">' + h(t('extra.tt.title')) + '</h4>' +
            '<p class="award"><span class="award__icon" aria-hidden="true">★</span>' + h(t('extra.tt.badge')) + '</p>' +
            '<p>' + h(t('extra.tt.text')) + '</p><p class="ttcard__role">' + h(t('extra.tt.role')) + '</p>' +
            ext(tt.prototype, t('extra.tt.cta')) +
          '</div>' + ((tt.photos || []).length ? mosaic(tt.photos) : '') + '</div>' +
          '<div class="lux rv">' +
            '<p class="lux__proud">' + h(t('extra.rebirth.proud')) + '</p>' +
            '<div class="lux__grid">' +
              '<button type="button" class="lux__poster" data-rb="0"><span class="lux__spot" aria-hidden="true"></span><img src="' + rb.poster_thumb + '" alt="' + I18N.esc(capOf({ file: 'parascolaire-rebirth-affiche' })) + '" loading="lazy" width="466" height="700"><span class="lux__shine" aria-hidden="true"></span></button>' +
              '<div class="lux__body">' +
                '<p class="lux__lbl">' + h(t('extra.rebirth.label')) + '</p>' +
                '<h4 class="lux__title">Rebirth</h4>' +
                '<p class="lux__text">' + h(t('extra.rebirth.text')) + '</p>' +
                '<button type="button" class="lux__team" data-rb="1"><img src="' + rb.team_thumb + '" alt="' + I18N.esc(capOf({ file: 'parascolaire-rebirth-equipe' })) + '" loading="lazy" width="700" height="525"><span>' + h(capOf({ file: 'parascolaire-rebirth-equipe' })) + '</span></button>' +
                ext(rb.plan, t('extra.rebirth.cta'), 'btn--gold') +
              '</div>' +
            '</div>' +
          '</div>';
      }
      return '<article class="club club--' + c.id + ' rv" data-club="' + c.id + '">' +
        '<header class="club__head">' + logo(c.logo, c.logo_alt, 'logo-chip--xl') +
          '<div><p class="club__theme"><span>' + h(t('extra.theme')) + '</span> ' + h(t(k + 'theme')) + '</p>' +
          '<h3 class="club__name">' + h(t(k + 'name')) + '</h3>' +
          '<p class="club__meta">' + [t(k + 'org'), t(k + 'date')].filter(function (x) { return I18N.clean(x); }).map(h).join(' · ') + '</p></div>' +
        '</header>' +
        '<div class="club__body' + (photos.length ? (HONEY[c.id] ? ' has-honey' : ' has-gal') : '') + '"><div class="club__text">' + inner + '</div>' + (photos.length ? (HONEY[c.id] ? honey(photos) : mosaic(photos)) : '') + '</div>' +
        extraBlocks +
      '</article>';
    }).join('');
    $('#extra-list').innerHTML = html;
    (SITE.clubs || []).forEach(function (c) {
      var el = $('#extra-list').querySelector('[data-club="' + c.id + '"]');
      if ((c.photos || []).length) { if (HONEY[c.id]) bindHoney(el.querySelector('.club__body'), c.photos); else bindMosaic(el.querySelector('.club__body'), c.photos); }
      if (c.steps_photos) el.querySelectorAll('[data-step-photo]').forEach(function (b) {
        b.addEventListener('click', function () {
          HJ.lightbox.open(c.steps_photos.map(function (p) { var cc = capOf(p); return { src: 'assets/img/' + p.folder + '/' + p.file + '.webp', alt: cc, caption: I18N.esc(cc) }; }), parseInt(b.getAttribute('data-step-photo'), 10));
        });
      });
      if (c.id === 'genie') {
        var tt = el.querySelector('[data-g="tt"]');
        if (tt && c.take_taste) bindMosaic(tt, c.take_taste.photos);
        var rb = c.rebirth;
        var items = [{ src: rb.poster, alt: capOf({ file: 'parascolaire-rebirth-affiche' }) }, { src: rb.team_photo, alt: capOf({ file: 'parascolaire-rebirth-equipe' }) }]
          .map(function (x) { return { src: x.src, alt: x.alt, caption: I18N.esc(x.alt) }; });
        el.querySelectorAll('[data-rb]').forEach(function (b) {
          b.addEventListener('click', function () { HJ.lightbox.open(items, parseInt(b.getAttribute('data-rb'), 10)); });
        });
      }
    });
    HJ.observe($('#extra-list'));
  }

  /* ---------- Compétences ---------- */
  function renderSkills() {
    var groups = t('skills.groups') || [];
    $('#skill-groups').innerHTML = groups.map(function (g, i) {
      return '<div class="sgroup rv' + (i === 0 ? ' sgroup--red' : '') + '" style="--d:' + (i * 80) + 'ms">' +
        '<p class="sgroup__num">0' + (i + 1) + '</p>' +
        (i === 0 ? '<div class="outbox" aria-hidden="false"><svg class="outbox__svg" viewBox="0 0 120 80" aria-hidden="true"><path class="outbox__body" d="M30 34 h60 v40 h-60 Z"/><path class="outbox__lid outbox__lid--l" d="M30 34 l-20 -16"/><path class="outbox__lid outbox__lid--r" d="M90 34 l20 -16"/><path class="outbox__spark" d="M60 24 v-10 M46 26 l-6 -8 M74 26 l6 -8"/></svg><p class="outbox__text">' + h(t('skills.box_hook')) + '</p></div>' : '') +
        '<h3 class="sgroup__name">' + h(g.name) + '</h3>' +
        '<ul>' + g.items.map(function (x, j) { return '<li style="--j:' + j + '">' + h(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    $('#tool-grid').innerHTML = ['analysis', 'creation', 'creativity', 'communication'].map(function (g) {
      var list = SITE.tools.filter(function (x) { return x.group === g; });
      return '<section class="tgroup tgroup--' + g + '"><h4 class="tgroup__name">' + h(t('skills.tool_groups.' + g)) + '</h4><ul class="tgroup__grid">' +
        list.map(function (x, i) {
          var name = (I18N.lang === 'en' && x.name_en) ? x.name_en : x.name;
          return '<li class="tool rv' + (x.svg ? '' : ' tool--noicon') + '" style="--d:' + (i * 50) + 'ms">' + (x.svg ? '<span class="tool__logo" aria-hidden="true">' + x.svg + '</span>' : '') + '<span class="tool__name">' + h(name) + '</span></li>';
        }).join('') + '</ul></section>';
    }).join('');
    $('#langs').innerHTML = (t('skills.lang_story') || []).map(function (l, i) {
      return '<li class="lang rv" style="--d:' + (i * 220) + 'ms"><span class="lang__n">0' + (i + 1) + '</span>' +
        '<p class="lang__lvl">' + h(l.level) + '</p><h4 class="lang__name">' + h(l.name) + '</h4><p class="lang__text">' + h(l.text) + '</p></li>';
    }).join('');
    HJ.observe($('#competences'));
  }

  /* ---------- Contact ---------- */
  function setupContact() {
    var btn = $('#copy-email');
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-copy');
      var done = function () {
        btn.textContent = t('contact.copied');
        btn.classList.add('is-ok');
        setTimeout(function () { btn.textContent = t('contact.copy'); btn.classList.remove('is-ok'); }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).then(done, fallback);
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = v; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        ta.remove();
      }
    });

    var form = $('#contact-form');
    var status = form.querySelector('.form__status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form__status';
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        var bad = form.querySelector(':invalid');
        if (bad) bad.focus();
        return;
      }
      var id = SITE.formspree;
      if (!id || /VOTRE_ID/.test(id)) {
        status.textContent = t('contact.not_ready');
        status.classList.add('is-error');
        return;
      }
      var send = form.querySelector('[type="submit"]');
      send.disabled = true; send.textContent = t('contact.sending');
      fetch('https://formspree.io/f/' + encodeURIComponent(id), {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        form.classList.remove('was-validated');
        status.textContent = t('contact.success');
        status.classList.add('is-ok');
      }).catch(function () {
        status.textContent = t('contact.error');
        status.classList.add('is-error');
      }).then(function () {
        send.disabled = false; send.textContent = t('contact.send');
      });
    });
  }

  function renderAll() {
    renderProjects();
    renderExperience();
    renderJobs();
    renderVideos();
    renderClubLogos();
    renderExtra();
    renderSkills();
  }

  HJ.site.then(function (site) {
    SITE = site;
    HJ.boot(function () {
      renderAll();
      setupContact();
      setupModal();
      I18N.onChange(renderAll);
    });
  });
})();
