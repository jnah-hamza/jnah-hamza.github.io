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

  /* ---------- Projets (mosaïques) ---------- */
  function projectCard(p, i) {
    var k = 'projects.items.' + p.id;
    var tiles = t(k + '.tiles') || [];
    var figs = t(k + '.figures') || [];
    var fig = figs[0] || { value: '', label: '' };
    var year = t(k + '.year');
    var chips = t(k + '.chips') || [];
    var cover = p.cover
      ? '<img src="' + p.cover + '" alt="" loading="lazy">'
      : '<span class="tile__pattern" aria-hidden="true"></span>';
    return '<article class="pcard pcard--' + p.id + (p.cover ? ' has-cover' : '') + ' rv" style="--d:' + (i * 90) + 'ms">' +
      '<div class="bento">' +
        '<div class="tile tile--hero">' + cover +
          '<span class="tile__num">0' + (i + 1) + '</span>' +
          '<h3 class="pcard__title"><a href="projet.html?id=' + p.id + '" class="stretched" data-project="' + p.id + '">' +
            '<span class="glitch" data-text="' + I18N.esc(I18N.clean(t(k + '.title'))) + '">' + h(t(k + '.title')) + '</span></a></h3>' +
          (p.group ? '<span class="chip chip--red">' + h(t('common.group')) + '</span>' : '') +
        '</div>' +
        '<div class="tile tile--type"><span class="tile__lbl">' + h(t('projects.labels.type')) + '</span><strong>' + h(t('projects.categories.' + p.category)) + '</strong></div>' +
        '<div class="tile tile--year"><span class="tile__lbl">' + h(year ? t('projects.labels.year') : t('projects.labels.team')) + '</span><strong>' + h(year || chips[0] || '') + '</strong></div>' +
        '<div class="tile tile--tall"><ul>' + tiles.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="tile tile--wide"><p>' + h(t(k + '.tagline')) + '</p><span class="tile__go" aria-hidden="true">' + h(t('projects.open')) + ' →</span></div>' +
        '<div class="tile tile--fig"><strong' + (String(fig.value).length > 3 ? ' class="is-long"' : '') + '>' + h(fig.value) + '</strong><span>' + h(fig.label) + '</span></div>' +
      '</div></article>';
  }
  function renderProjects() {
    var track = $('#projects-track');
    track.innerHTML = SITE.projects.map(projectCard).join('');
    HJ.observe(track);
    setupHScroll();
  }

  /* Fenêtre pop-up d'un projet */
  var modal = { open: null, last: null };
  function setupModal() {
    var box = $('#pmodal'), content = $('#pmodal-content'), inner = $('#pmodal-box');
    function show(id) {
      var P = SITE.projects.filter(function (p) { return p.id === id; })[0];
      if (!P) return;
      modal.open = id;
      content.innerHTML = HJ.projectHTML(P, SITE.projects, '');
      box.hidden = false;
      document.documentElement.classList.add('modal-open');
      requestAnimationFrame(function () { box.classList.add('is-open'); });
      inner.scrollTop = 0;
      HJ.bindProject(content);
      inner.focus({ preventScroll: true });
    }
    function close() {
      if (!modal.open) return;
      modal.open = null;
      box.classList.remove('is-open');
      document.documentElement.classList.remove('modal-open');
      setTimeout(function () { box.hidden = true; content.innerHTML = ''; }, 250);
      if (modal.last) modal.last.focus({ preventScroll: true });
    }
    modal.show = show;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-project]');
      if (!a) return;
      e.preventDefault();
      if (!modal.open) modal.last = a;
      show(a.getAttribute('data-project'));
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
    I18N.onChange(function () { if (modal.open) { var id = modal.open; content.innerHTML = HJ.projectHTML(SITE.projects.filter(function (p) { return p.id === id; })[0], SITE.projects, ''); HJ.bindProject(content); } });
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
      if (!hs.on) return;
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
          '<div class="timeline__head"><p class="timeline__date">' + h(e.date) + '</p>' + logo(d.logo, d.logo_alt, 'logo-chip--lg') + '</div>' +
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
  var tilts = [-5, 3, -2, 6, -4];
  function capOf(p) { return t('extra.captions.' + p.file); }
  function gallery(photos) {
    return '<div class="club__gal polas polas--small">' + photos.map(function (p, i) { return pola(p, capOf(p), tilts[i % 5], i === 0 ? 'm' : 's', i); }).join('') + '</div>';
  }
  function ext(url, label, cls) {
    return url ? '<a class="btn ' + (cls || 'btn--red') + '" href="' + url + '" target="_blank" rel="noopener">' + h(label) + ' ↗<span class="sr-only"> ' + h(t('common.new_tab')) + '</span></a>' : '';
  }
  function renderClubLogos() {
    $('#club-logos').innerHTML = '<p class="club-logos__lbl">' + h(t('extra.logos_label')) + '</p><ul>' +
      (SITE.club_logos || []).map(function (l) { return '<li>' + logo(l[0], l[1], 'logo-chip--xl') + '</li>'; }).join('') + '</ul>';
  }
  function renderAwards() {
    var a = 'extra.awards.';
    var stats = t(a + 'hack.stats') || [];
    var ph = (SITE.distinctions || {}).hackathon_photos || [];
    $('#awards').innerHTML = '<div class="awards__head"><svg class="awards__trophy" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v3H8v-3h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3zm0 4H6v1a2 2 0 0 0 1 1.7V7zm10 0v2.7A2 2 0 0 0 18 8V7h-1z"/></svg><h3 class="awards__title">' + h(t(a + 'title')) + '</h3></div>' +
      '<div class="awards__grid">' +
        '<article class="award-card rv"><span class="award-card__n">01</span><h4>' + h(t(a + 'hult.title')) + '</h4><p class="award-card__sub">' + h(t(a + 'hult.sub')) + '</p></article>' +
        '<article class="award-card award-card--hack rv"><span class="award-card__n">02</span>' + logo((SITE.distinctions || {}).hackathon_logo, 'ACCEDE Internationale', 'logo-chip--lg') +
          '<h4>' + h(t(a + 'hack.title')) + '</h4><p class="award-card__sub">' + h(t(a + 'hack.sub')) + '</p>' +
          '<ul class="award-card__stats">' + stats.map(function (s) { return '<li><strong>' + h(s.v) + '</strong><span>' + h(s.l) + '</span></li>'; }).join('') + '</ul>' +
          '<p>' + h(t(a + 'hack.text')) + '</p></article>' +
      '</div>' + (ph.length ? gallery(ph) : '');
    if (ph.length) bindGallery($('#awards'), ph, capOf);
    HJ.observe($('#awards'));
  }
  function roles(list) {
    return '<ol class="club__roles">' + (list || []).map(function (r) {
      return '<li class="rv"><h4>' + h(r.title) + '</h4><p>' + h(r.text) + '</p></li>';
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
        inner = '<ol class="club__steps">' + steps.map(function (s, i) {
          return '<li class="rv" style="--d:' + (i * 150) + 'ms"><span class="club__step-n">0' + (i + 1) + '</span>' + (s.date ? '<p class="club__step-date">' + h(s.date) + '</p>' : '') + '<h4>' + h(s.title) + '</h4><p>' + h(s.text) + '</p></li>';
        }).join('<li class="club__arrow" aria-hidden="true">→</li>') + '</ol>';
      } else {
        inner = roles(t(k + 'roles'));
        var sk = t(k + 'skills') || [];
        if (sk.length) inner += '<p class="club__skills">' + sk.map(function (x) { return '<span class="chip">' + h(x) + '</span>'; }).join('') + '</p>';
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
          '</div>' + ((tt.photos || []).length ? gallery(tt.photos) : '') + '</div>' +
          '<div class="subcard rebirth rv">' +
            '<button type="button" class="rebirth__poster" data-rb="0"><img src="' + rb.poster_thumb + '" alt="' + I18N.esc(capOf({ file: 'parascolaire-rebirth-affiche' })) + '" loading="lazy" width="466" height="700"></button>' +
            '<div class="rebirth__body">' +
              '<p class="campaign__lbl">' + h(t('extra.rebirth.label')) + '</p>' +
              '<h4 class="campaign__title"><span class="glitch" data-text="REBIRTH">REBIRTH</span></h4>' +
              '<p>' + h(t('extra.rebirth.text')) + '</p>' +
              '<button type="button" class="rebirth__team" data-rb="1"><img src="' + rb.team_thumb + '" alt="' + I18N.esc(capOf({ file: 'parascolaire-rebirth-equipe' })) + '" loading="lazy" width="700" height="525"><span class="hand">' + h(capOf({ file: 'parascolaire-rebirth-equipe' })) + '</span></button>' +
              ext(rb.plan, t('extra.rebirth.cta')) +
            '</div>' +
            '<span class="campaign__stamp" aria-hidden="true">VOTE ✦</span>' +
          '</div>';
      }
      return '<article class="club club--' + c.id + ' rv" data-club="' + c.id + '">' +
        '<header class="club__head">' + logo(c.logo, c.logo_alt, 'logo-chip--xl') +
          '<div><p class="club__theme"><span>' + h(t('extra.theme')) + '</span> ' + h(t(k + 'theme')) + '</p>' +
          '<h3 class="club__name">' + h(t(k + 'name')) + '</h3>' +
          '<p class="club__meta">' + [t(k + 'org'), t(k + 'date')].filter(function (x) { return I18N.clean(x); }).map(h).join(' · ') + '</p></div>' +
        '</header>' +
        '<div class="club__body' + (photos.length ? ' has-gal' : '') + '"><div class="club__text">' + inner + '</div>' + (photos.length ? gallery(photos) : '') + '</div>' +
        extraBlocks +
      '</article>';
    }).join('');
    $('#extra-list').innerHTML = html;
    (SITE.clubs || []).forEach(function (c) {
      var el = $('#extra-list').querySelector('[data-club="' + c.id + '"]');
      var bodyGal = el.querySelector('.club__body');
      if ((c.photos || []).length) bindGallery(bodyGal, c.photos, capOf);
      if (c.id === 'genie') {
        var tt = el.querySelector('[data-g="tt"]');
        if (tt && c.take_taste) bindGallery(tt, c.take_taste.photos, capOf);
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
  function toolIcon(x) {
    if (x.path) return '<svg viewBox="0 0 24 24" aria-hidden="true" style="--c:#' + x.hex + '"><path d="' + x.path + '"/></svg>';
    var light = /^(F2C811)$/i.test(x.hex);
    return '<span class="tool__ini' + (light ? ' is-light' : '') + '" style="--c:#' + x.hex + '" aria-hidden="true">' + I18N.esc(x.initials) + '</span>';
  }
  function renderSkills() {
    var groups = t('skills.groups') || [];
    $('#skill-groups').innerHTML = groups.map(function (g, i) {
      return '<div class="sgroup rv' + (i === 0 ? ' sgroup--red' : '') + '" style="--d:' + (i * 80) + 'ms">' +
        '<p class="sgroup__num">0' + (i + 1) + '</p>' +
        '<h3 class="sgroup__name">' + h(g.name) + '</h3>' +
        '<ul>' + g.items.map(function (x, j) { return '<li style="--j:' + j + '">' + h(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    $('#tool-grid').innerHTML = ['analysis', 'creation', 'communication'].map(function (g) {
      var list = SITE.tools.filter(function (x) { return x.group === g; });
      return '<section class="tgroup"><h4 class="tgroup__name">' + h(t('skills.tool_groups.' + g)) + '</h4><ul class="tgroup__grid">' +
        list.map(function (x, i) {
          var name = (I18N.lang === 'en' && x.name_en) ? x.name_en : x.name;
          return '<li class="tool rv" style="--d:' + (i * 50) + 'ms;--c:#' + x.hex + '">' + toolIcon(x) + '<span class="tool__name">' + h(name) + '</span></li>';
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
