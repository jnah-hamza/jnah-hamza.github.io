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
  var PH = 'assets/img/photos/';

  /* ---------- À propos ---------- */
  function renderAbout() {
    var tools = ['Excel', 'Power BI', 'SPSS', 'Google Analytics', 'Brevo', 'Canva', 'Figma', 'Photoshop', 'Illustrator', 'Premiere Pro', 'DaVinci Resolve'];
    $('#about-tools').innerHTML = tools.map(function (n, i) {
      return '<li class="pill rv" style="--d:' + (i * 40) + 'ms">' + h(n) + '</li>';
    }).join('');
    var tilts = [-6, 4, -2];
    var sizes = ['m', 's', 'm'];
    $('#about-polas').innerHTML = SITE.about_polaroids.map(function (f, i) {
      return HJ.polaroid({
        thumb: PH + 'thumbs/' + f + '.webp', alt: t('photo.alts.' + f),
        caption: t('photo.captions.' + f), tilt: tilts[i % 3], size: sizes[i % 3], w: 600, h: f.indexOf('tram') > -1 ? 800 : 450
      });
    }).join('');
    $('#about-polas').querySelectorAll('.polaroid').forEach(function (p, i) { p.setAttribute('data-parallax', String(0.03 + i * 0.03)); });
  }

  /* ---------- Projets (mosaïques) ---------- */
  function projectCard(p, i) {
    var k = 'projects.items.' + p.id;
    var tiles = t(k + '.tiles') || [];
    var figs = t(k + '.figures') || [];
    var fig = figs[0] || { value: '', label: '' };
    var cover = p.cover
      ? '<img src="' + p.cover + '" alt="" loading="lazy">'
      : '<span class="tile__pattern" aria-hidden="true"></span>';
    return '<article class="pcard pcard--' + p.id + ' rv" style="--d:' + (i * 90) + 'ms">' +
      '<div class="bento">' +
        '<div class="tile tile--hero">' + cover +
          '<span class="tile__num">0' + (i + 1) + '</span>' +
          '<h3 class="pcard__title"><a href="projet.html?id=' + p.id + '" class="stretched">' +
            '<span class="glitch" data-text="' + I18N.esc(t(k + '.title')) + '">' + h(t(k + '.title')) + '</span></a></h3>' +
          (p.group ? '<span class="chip chip--red">' + h(t('common.group')) + '</span>' : '') +
          (p.ongoing ? '<span class="chip chip--blink">● ' + h(t('common.ongoing')) + '</span>' : '') +
        '</div>' +
        '<div class="tile tile--type"><span class="tile__lbl">' + h(t('projects.labels.type')) + '</span><strong>' + h(t('projects.types.' + p.type)) + '</strong></div>' +
        '<div class="tile tile--year"><span class="tile__lbl">' + h(t('projects.labels.year')) + '</span><strong>' + h(t(k + '.year')) + '</strong></div>' +
        '<div class="tile tile--tall"><ul>' + tiles.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="tile tile--wide"><p>' + h(t(k + '.tagline')) + '</p><span class="tile__go" aria-hidden="true">' + h(t('projects.open')) + ' →</span></div>' +
        '<div class="tile tile--fig"><strong>' + h(fig.value) + '</strong><span>' + h(fig.label) + '</span></div>' +
      '</div></article>';
  }
  function renderProjects() {
    var track = $('#projects-track');
    track.innerHTML = SITE.projects.map(projectCard).join('');
    HJ.observe(track);
    setupHScroll();
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
    // Clavier : amène la carte focalisée à l'écran
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

  /* ---------- Carnet de croquis (Take & Taste) ---------- */
  function renderSketch() {
    var k = 'projects.items.take-taste.sketch.';
    var wrap = $('#sketch');
    wrap.innerHTML = HJ.sketchSVG(k) +
      '<p class="sketch-wrap__lbl"><span class="star">✦✦✦</span> ' + h(t('sketch.label')) + ' · <a href="projet.html?id=take-taste">' + h(t('projects.items.take-taste.title')) + ' →</a></p>';
    HJ.observe(wrap);
  }

  /* ---------- Expériences ---------- */
  function renderExperience() {
    var items = t('experience.items') || [];
    $('#timeline').innerHTML = items.map(function (e, i) {
      return '<li class="timeline__item" style="--d:' + (i * 120) + 'ms">' +
        '<span class="timeline__dot" aria-hidden="true"></span>' +
        '<div class="timeline__card">' +
          '<p class="timeline__date">' + h(e.date) + '</p>' +
          '<h3 class="timeline__role">' + h(e.role) + '</h3>' +
          '<p class="timeline__org"><strong>' + h(e.org) + '</strong> · ' + h(e.place) + '</p>' +
          '<ul class="timeline__points">' + e.points.map(function (p) { return '<li>' + h(p) + '</li>'; }).join('') + '</ul>' +
          '<p class="timeline__tags">' + (e.tags || []).map(function (x) { return '<span class="chip">' + h(x) + '</span>'; }).join('') + '</p>' +
        '</div></li>';
    }).join('');
    $('#jobs').innerHTML = (t('experience.jobs') || []).map(function (j) {
      return '<li class="rv"><p class="mini-list__date">' + h(j.date) + '</p><h4>' + h(j.role) + '</h4><p>' + h(j.org) + '</p>' + (j.desc ? '<p class="mini-list__desc">' + h(j.desc) + '</p>' : '') + '</li>';
    }).join('');
    $('#education').innerHTML = (t('experience.education') || []).map(function (j) {
      return '<li class="rv"><p class="mini-list__date">' + h(j.date) + '</p><h4>' + h(j.degree) + '</h4><p>' + h(j.school) + '</p>' + (j.note ? '<p class="mini-list__desc">' + h(j.note) + '</p>' : '') + '</li>';
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

  /* ---------- Vidéos ---------- */
  function renderVideos() {
    var items = t('video.items') || [];
    $('#videos').innerHTML = SITE.videos.map(function (v, i) {
      var it = items[i] || {};
      var media = v.youtube
        ? '<button class="yt" type="button" data-yt="' + I18N.esc(v.youtube) + '" aria-label="' + I18N.esc(t('video.play') + ' : ' + (it.title || '')) + '">' +
            '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube) + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">' +
            '<span class="yt__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span></button>'
        : '<div class="yt yt--empty"><span>' + h(t('video.missing')) + '</span><mark class="todo">[À COMPLÉTER : lien YouTube]</mark></div>';
      return '<article class="vcard vcard--' + (i + 1) + ' rv" style="--d:' + (i * 100) + 'ms">' +
        '<div class="vcard__media">' + media + '<span class="vcard__rec" aria-hidden="true">● REC</span></div>' +
        '<div class="vcard__body">' +
          '<p class="vcard__num">0' + (i + 1) + '</p>' +
          '<h3 class="vcard__title">' + h(it.title) + '</h3>' +
          '<p class="vcard__poem hand">' + h(it.poem) + '</p>' +
          '<dl class="vcard__meta">' +
            '<div><dt>' + h(t('video.labels.place')) + '</dt><dd>' + h(it.place) + '</dd></div>' +
            '<div><dt>' + h(t('video.labels.software')) + '</dt><dd>' + h(it.software) + '</dd></div>' +
            '<div><dt>' + h(t('video.labels.role')) + '</dt><dd>' + h(it.role) + '</dd></div>' +
          '</dl></div></article>';
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
  function gallery(photos, n) {
    var tilts = [-5, 3, -2, 6];
    if (!photos || !photos.length) {
      var out = '';
      for (var i = 0; i < n; i++) out += HJ.polaroid({ placeholder: t('extra.photo_todo'), caption: t('extra.caption_todo'), tilt: tilts[i % 4], size: 's' });
      return out;
    }
    return photos.map(function (p, i) {
      return HJ.polaroid({ thumb: p.src, alt: p['alt_' + I18N.lang] || p.alt || '', caption: p['caption_' + I18N.lang] || p.caption || t('extra.caption_todo'), tilt: tilts[i % 4], size: 's', w: p.w, h: p.h });
    }).join('');
  }
  function renderExtra() {
    var items = t('extra.items') || [];
    var rb = SITE.campaigns[0];
    $('#extra-list').innerHTML = items.map(function (e, i) {
      var photos = (SITE.extra[i] || {}).photos || [];
      var reb = i === 2
        ? '<a class="campaign rv" href="projet.html?id=' + rb.id + '">' +
            '<span class="campaign__lbl">' + h(t('extra.rebirth.label')) + '</span>' +
            '<span class="campaign__title"><span class="glitch" data-text="REBIRTH">REBIRTH</span></span>' +
            '<span class="campaign__text">' + h(t('extra.rebirth.text')) + '</span>' +
            '<span class="campaign__cta">' + h(t('extra.rebirth.cta')) + ' →</span>' +
            '<span class="campaign__stamp" aria-hidden="true">VOTE ✦</span>' +
          '</a>'
        : '';
      return '<article class="xcard rv' + (i % 2 ? ' xcard--alt' : '') + '">' +
        '<div class="xcard__text">' +
          '<p class="xcard__date">' + h(e.date) + '</p>' +
          '<h3 class="xcard__role">' + h(e.role) + '</h3>' +
          '<p class="xcard__org sel">' + h(e.org) + '<i class="sel__h" aria-hidden="true"></i><i class="sel__h" aria-hidden="true"></i></p>' +
          '<p>' + h(e.desc) + '</p>' + reb +
        '</div>' +
        '<div class="xcard__gal polas polas--small">' + gallery(photos, 2) + '</div>' +
      '</article>';
    }).join('');
    HJ.observe($('#extra-list'));
  }

  /* ---------- Compétences ---------- */
  function renderSkills() {
    var groups = t('skills.groups') || [];
    $('#skill-groups').innerHTML = groups.map(function (g, i) {
      return '<div class="sgroup rv' + (i === 3 ? ' sgroup--red' : '') + '" style="--d:' + (i * 80) + 'ms">' +
        '<p class="sgroup__num">0' + (i + 1) + '</p>' +
        '<h3 class="sgroup__name">' + h(g.name) + '</h3>' +
        '<ul>' + g.items.map(function (x, j) { return '<li style="--j:' + j + '">' + h(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    $('#tool-grid').innerHTML = SITE.tools.map(function (x, i) {
      var name = (I18N.lang === 'en' && x.name_en) ? x.name_en : x.name;
      return '<li class="rv" style="--d:' + (i * 30) + 'ms"><span class="tool-grid__lbl">' + h(t('skills.tool_cats.' + x.cat)) + '</span><span class="tool-grid__name">' + h(name) + '</span></li>';
    }).join('');
    $('#langs').innerHTML = (t('skills.languages') || []).map(function (l) {
      return '<li class="rv"><span class="langs__lvl">' + h(l.level) + '</span><span class="langs__name">' + h(l.name) + '</span></li>';
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
    renderAbout();
    renderProjects();
    renderSketch();
    renderExperience();
    renderVideos();
    renderExtra();
    renderSkills();
  }

  HJ.site.then(function (site) {
    SITE = site;
    HJ.boot(function () {
      renderAll();
      setupContact();
      I18N.onChange(renderAll);
    });
  });
})();
