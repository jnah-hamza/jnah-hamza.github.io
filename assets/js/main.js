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
    return '<article class="pcard pcard--' + p.id + (p.cover ? ' has-cover' : '') + ' rv" style="--d:' + (i * 90) + 'ms" data-card="' + p.id + '">' +
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

  /* Défilement horizontal des projets pendant le scroll (ordinateur) */
  var hs = { on: false };
  function setupHScroll() {
    var sec = $('#hscroll'), track = $('#projects-track');
    if (hs.bound) { hs.measure(); return; }
    hs.bound = true;
    function enabled() { return window.innerWidth >= 1024 && !HJ.reduce; }
    hs.measure = function () {
      hs.on = enabled();
      sec.classList.toggle('is-h', hs.on);
      if (!hs.on) { sec.style.height = ''; track.style.transform = ''; return; }
      hs.max = Math.max(0, track.scrollWidth - window.innerWidth);
      sec.style.height = (hs.max + window.innerHeight) + 'px';
      hs.update();
    };
    hs.update = function () {
      if (!hs.on) return;
      var top = sec.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, -top / Math.max(1, hs.max)));
      track.style.transform = 'translate3d(' + (-p * hs.max).toFixed(1) + 'px,0,0)';
      sec.style.setProperty('--hp', p.toFixed(3));
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(hs.update); }, { passive: true });
    window.addEventListener('resize', hs.measure);
    track.addEventListener('focusin', function (e) {
      if (!hs.on || modal.restoring || !e.target.matches(':focus-visible')) return;
      var card = e.target.closest('.pcard');
      if (!card) return;
      var x = Math.min(hs.max, Math.max(0, card.offsetLeft - 80));
      window.scrollTo({ top: sec.offsetTop + x, behavior: 'auto' });
    });
    document.fonts && document.fonts.ready.then(hs.measure);
    hs.measure();
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
    $('#education').innerHTML = (t('experience.education') || []).map(function (j, i) {
      var d = (SITE.education || [])[i] || {};
      return '<li class="rv' + (d.logo ? ' has-logo' : '') + '">' + logo(d.logo, d.logo_alt) + '<div><p class="mini-list__date">' + h(j.date) + '</p><h4>' + h(j.degree) + '</h4><p>' + h(j.school) + '</p>' + (j.note ? '<p class="mini-list__desc">' + h(j.note) + '</p>' : '') + '</div></li>';
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
  function renderAwards() {
    var a = 'extra.awards.';
    $('#awards').innerHTML = '<div class="awards__head"><svg class="awards__trophy" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1z"/></svg><h3 class="awards__title">' + h(t(a + 'title')) + '</h3></div>' +
      '<div class="awards__grid">' +
        '<article class="award-card rv"><span class="award-card__n">01</span><h4>' + h(t(a + 'hult.title')) + '</h4><p class="award-card__sub">' + h(t(a + 'hult.sub')) + '</p></article>' +
        '<article class="award-card rv" style="--d:120ms"><span class="award-card__n">02</span><h4>' + h(t(a + 'hack_short')) + '</h4><p class="award-card__sub">' + h(t(a + 'hack.sub')) + '</p></article>' +
      '</div>';
    HJ.observe($('#awards'));
  }

  /* Décors animés propres à chaque club */
  var DECO = {
    epik: '<svg class="deco deco--chess" viewBox="0 0 120 140"><path class="d-k" d="M40 128 h44 v-10 h-6 l-4 -30 c10 -6 14 -18 8 -30 c-6 -12 -20 -16 -30 -10 l-14 10 l4 6 l8 -4 c-2 10 -10 14 -10 26 l6 32 h-6 Z"/></svg>' +
          '<svg class="deco deco--pawn" viewBox="0 0 60 90"><circle cx="30" cy="18" r="11"/><path d="M18 34 h24 l-4 10 c6 8 8 18 10 30 h-36 c2 -12 4 -22 10 -30 Z M10 84 h40 v-8 h-40 Z"/></svg>' +
          '<svg class="deco deco--arrows" viewBox="0 0 220 120"><path class="d-line" d="M10 100 C 60 20, 120 120, 170 30"/><path class="d-line" d="M170 30 l-14 2 M170 30 l2 14"/><path class="d-line d-x" d="M190 90 l12 12 M202 90 l-12 12"/><circle class="d-line" cx="40" cy="30" r="10"/></svg>',
    genie: '<svg class="deco deco--bulb" viewBox="0 0 80 110"><path class="d-glow" d="M40 6 a30 30 0 0 1 18 54 c-4 4 -6 8 -6 14 h-24 c0 -6 -2 -10 -6 -14 A30 30 0 0 1 40 6 Z"/><path d="M28 80 h24 M30 88 h20 M34 96 h12"/><path class="d-ray" d="M40 0 v-8 M8 20 l-8 -6 M72 20 l8 -6"/></svg>' +
           '<svg class="deco deco--rocket" viewBox="0 0 80 140"><path d="M40 6 c18 18 22 46 14 74 h-28 c-8 -28 -4 -56 14 -74 Z"/><circle cx="40" cy="44" r="8" class="d-win"/><path d="M26 64 l-14 22 l16 -4 M54 64 l14 22 l-16 -4"/><path class="d-flame" d="M30 84 c2 18 8 30 10 40 c2 -10 8 -22 10 -40 Z"/></svg>' +
           '<svg class="deco deco--sketch" viewBox="0 0 200 80"><path class="d-line" d="M6 60 C 40 10, 70 70, 110 30 S 170 10, 194 40"/><path class="d-line" d="M20 74 h60"/></svg>',
    aiesec: '<div class="deco deco--map"></div>' +
            '<span class="deco deco--stamp s1">CASABLANCA</span><span class="deco deco--stamp s2">GLOBAL<br>TALENT</span><span class="deco deco--stamp s3">YOUTH ✦ 100+</span>' +
            '<span class="deco deco--flags">🇲🇦 🇫🇷 🇧🇷 🇮🇳 🇩🇪 🇪🇬 🇹🇷 🇯🇵</span>',
    green: '<svg class="deco deco--leaf l1" viewBox="0 0 80 120"><path d="M40 4 C 74 34, 74 86, 40 116 C 6 86, 6 34, 40 4 Z"/><path class="d-vein" d="M40 10 V 114 M40 40 l-16 -10 M40 60 l18 -12 M40 82 l-16 -10"/></svg>' +
           '<svg class="deco deco--leaf l2" viewBox="0 0 80 120"><path d="M40 4 C 74 34, 74 86, 40 116 C 6 86, 6 34, 40 4 Z"/><path class="d-vein" d="M40 10 V 114 M40 40 l16 -10 M40 62 l-18 -12"/></svg>' +
           '<svg class="deco deco--leaf l3" viewBox="0 0 80 120"><path d="M40 4 C 74 34, 74 86, 40 116 C 6 86, 6 34, 40 4 Z"/><path class="d-vein" d="M40 10 V 114"/></svg>' +
           '<svg class="deco deco--sprout" viewBox="0 0 100 120"><path class="d-stem" d="M50 118 V 50"/><path d="M50 70 C 20 70, 10 44, 14 30 C 34 30, 50 46, 50 70 Z"/><path d="M50 56 C 80 56, 90 30, 86 16 C 66 16, 50 32, 50 56 Z"/></svg>',
    accede: '<svg class="deco deco--lighthouse" viewBox="0 0 160 220"><defs><linearGradient id="beamg" x1="0" x2="1"><stop offset="0" stop-color="#ffd76a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></linearGradient></defs>' +
            '<g class="d-beam"><path d="M80 52 L 320 12 L 320 92 Z" fill="url(#beamg)"/><path d="M80 52 L -160 12 L -160 92 Z" fill="url(#beamg)" transform="rotate(180 80 52) scale(1,-1) translate(0,-104)"/></g>' +
            '<path class="d-tower" d="M62 210 L 70 70 h20 L 98 210 Z"/><path class="d-stripe" d="M66 130 h28 l1 16 h-30 Z M64 170 h32 l1 16 h-34 Z"/><rect x="64" y="40" width="32" height="30" rx="4" class="d-lamp"/><path d="M60 40 h40 l-20 -18 Z" class="d-tower"/><path d="M40 212 h80" class="d-line"/></svg>' +
            '<svg class="deco deco--trophy" viewBox="0 0 24 24"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1z"/></svg>'
  };

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
        inner = '<ol class="club__steps club__steps--' + steps.length + '">' + steps.map(function (st, i) {
          return '<li class="rv" style="--d:' + (i * 160) + 'ms"><span class="club__step-n">0' + (i + 1) + '</span>' + (I18N.clean(st.date) ? '<p class="club__step-date">' + h(st.date) + '</p>' : '') + '<h4>' + h(st.title) + '</h4>' + (I18N.clean(st.text) ? '<p>' + h(st.text) + '</p>' : '') + '</li>';
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
        '<div class="club__deco" aria-hidden="true">' + (DECO[c.id] || '') + '</div>' +
        '<header class="club__head">' + logo(c.logo, c.logo_alt, 'logo-chip--xl') +
          '<div><p class="club__theme"><span>' + h(t('extra.theme')) + '</span> ' + h(t(k + 'theme')) + '</p>' +
          '<h3 class="club__name">' + h(t(k + 'name')) + '</h3>' +
          '<p class="club__meta">' + [t(k + 'org'), t(k + 'date')].filter(function (x) { return I18N.clean(x); }).map(h).join(' · ') + '</p></div>' +
        '</header>' +
        '<div class="club__body' + (photos.length ? ' has-gal' : '') + '"><div class="club__text">' + inner + '</div>' + (photos.length ? mosaic(photos) : '') + '</div>' +
        extraBlocks +
      '</article>';
    }).join('');
    $('#extra-list').innerHTML = html;
    (SITE.clubs || []).forEach(function (c) {
      var el = $('#extra-list').querySelector('[data-club="' + c.id + '"]');
      if ((c.photos || []).length) bindMosaic(el.querySelector('.club__body'), c.photos);
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
    renderAwards();
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
