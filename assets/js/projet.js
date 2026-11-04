/* =========================================================
   Page détail d'un projet : projet.html?id=take-taste
   La mise en page change selon le type : prototype, rapport,
   vidéo, marque / entrepreneuriat, campagne.
   ========================================================= */
(function () {
  'use strict';

  var t = function (k, v) { return I18N.t(k, v); };
  var h = function (s) { return I18N.html(s); };
  var id = new URLSearchParams(location.search).get('id') || '';
  var SITE, P, list;
  var root = document.getElementById('detail');

  function find() {
    list = SITE.projects;
    P = SITE.projects.filter(function (p) { return p.id === id; })[0] ||
        SITE.campaigns.filter(function (p) { return p.id === id; })[0];
  }

  function chip(text, cls) { return '<span class="chip ' + (cls || '') + '">' + h(text) + '</span>'; }

  function facts(k) {
    var tools = t(k + '.tools') || [];
    return '<section class="dsec paper"><div class="wrap"><div class="facts">' +
      '<div class="fact fact--wide rv"><span class="fact__lbl">' + h(t('projects.labels.context')) + '</span><p>' + h(t(k + '.context')) + '</p></div>' +
      '<div class="fact rv"><span class="fact__lbl">' + h(t('projects.labels.problem')) + '</span><p>' + h(t(k + '.problem')) + '</p></div>' +
      '<div class="fact rv"><span class="fact__lbl">' + h(t('projects.labels.role')) + '</span><p>' + h(t(k + '.role')) + '</p></div>' +
      '<div class="fact rv"><span class="fact__lbl">' + h(t('projects.labels.output')) + '</span><p>' + h(t(k + '.output')) + '</p></div>' +
      '<div class="fact fact--red rv"><span class="fact__lbl">' + h(t('projects.labels.result')) + '</span><p>' + h(t(k + '.result')) + '</p></div>' +
      '<div class="fact fact--wide rv"><span class="fact__lbl">' + h(t('projects.labels.tools')) + '</span><div class="tools-row">' + tools.map(function (x) { return chip(x); }).join('') + '</div></div>' +
      '</div></div></section>';
  }

  function figures(k) {
    var f = t(k + '.figures') || [];
    if (!f.length) return '';
    return '<h2 class="dsec__title">' + h(t('projects.labels.figures')) + '</h2><div class="figures">' +
      f.map(function (x, i) { return '<div class="figure rv" style="--d:' + (i * 90) + 'ms"><strong>' + h(x.value) + '</strong><span>' + h(x.label) + '</span></div>'; }).join('') + '</div>';
  }

  function pages(arr, n) {
    if (arr && arr.length) {
      return '<div class="pages">' + arr.map(function (src, i) {
        return '<button type="button" class="pages__img" data-gal="' + i + '"><img src="' + src + '" alt="Page ' + (i + 1) + '" loading="lazy"></button>';
      }).join('') + '</div>';
    }
    var out = '';
    for (var i = 0; i < n; i++) out += '<div class="pages__ph">' + h(t('projects.page_todo')) + ' ' + (i + 1) + '</div>';
    return '<div class="pages" tabindex="0">' + out + '</div>';
  }

  function pdfButton(file, labelKey) {
    return '<a class="btn btn--red" data-pdf="' + file + '" href="' + file + '" download aria-disabled="true">' + h(labelKey) + '</a>';
  }

  /* --- Mise en page selon le type --- */
  function showcase(k) {
    var type = P.type;
    var inner = '';
    if (type === 'prototype') {
      var screens = P.screens && P.screens.length ? P.screens : null;
      var strip = screens
        ? screens.map(function (s, i) { return '<img src="' + s + '" alt="' + I18N.esc(t(k + '.title') + ' — ' + (i + 1)) + '" loading="lazy">'; }).join('')
        : [1, 2, 3].map(function (n) { return '<div class="phone__ph"><strong>Take<br>&amp; Taste</strong><span>' + h(t('projects.screen_todo')) + ' ' + n + '</span></div>'; }).join('');
      var count = screens ? screens.length : 3;
      inner = '<div class="phone-wrap">' +
        '<div class="phone" aria-hidden="' + (screens ? 'false' : 'true') + '"><div class="phone__screen"><div class="phone__strip is-anim" style="--end:' + (-(count - 1) / count * 100).toFixed(2) + '%;--dur:' + (count * 4) + 's">' + strip + '</div></div></div>' +
        '<div><h2 class="dsec__title">' + h(t('projects.labels.screens')) + '</h2>' + figures(k) +
        '<div class="cta-row">' + (P.figma
          ? '<a class="btn btn--red" href="' + P.figma + '" target="_blank" rel="noopener">' + h(t('projects.labels.figma')) + ' ↗<span class="sr-only"> ' + h(t('common.new_tab')) + '</span></a>'
          : '<span class="btn btn--red" aria-disabled="true">' + h(t('projects.labels.figma')) + ' · ' + h(t('common.soon')) + '</span> <mark class="todo">[À COMPLÉTER : lien Figma]</mark>') +
        '</div></div></div>';
    } else if (type === 'report') {
      var hl = t(k + '.highlights') || [];
      inner = figures(k) +
        (hl.length ? '<h2 class="dsec__title" style="margin-top:56px">' + h(t('projects.labels.highlights')) + '</h2><ul class="highlights">' + hl.map(function (x) { return '<li class="rv">' + h(x) + '</li>'; }).join('') + '</ul>' : '') +
        '<h2 class="dsec__title" style="margin-top:56px">' + h(t('projects.labels.pages')) + '</h2>' + pages(P.pages, 4) +
        '<div class="cta-row">' + pdfButton(P.pdf, t('projects.labels.pdf')) + '</div>';
    } else if (type === 'video') {
      inner = '<div class="video-big"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(P.youtube || '') + '?rel=0" title="' + I18N.esc(t(k + '.title')) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
        '<div style="margin-top:48px">' + figures(k) + '</div>';
    } else if (type === 'brand') {
      var g = P.gallery || [];
      var cells = g.length
        ? g.map(function (src, i) { return '<button type="button" data-gal="' + i + '"><img src="' + src + '" alt="' + I18N.esc(t(k + '.title') + ' — ' + (i + 1)) + '" loading="lazy"></button>'; }).join('')
        : [1, 2, 3, 4, 5, 6].map(function (n) { return '<div class="gallery__ph">' + h(t('projects.image_todo')) + ' ' + n + '</div>'; }).join('');
      inner = '<h2 class="dsec__title">' + h(t('projects.labels.gallery')) + '</h2><div class="gallery">' + cells + '</div>' +
        '<div style="margin-top:56px">' + figures(k) + '</div>';
    } else if (type === 'campaign') {
      inner = '<h2 class="dsec__title">' + h(t('projects.labels.pages')) + '</h2>' + pages(P.pages, 5) +
        '<div class="cta-row">' + (P.pdfs || []).map(function (d) { return pdfButton(d.file, t(k + '.' + d.label)); }).join('') + '</div>' +
        '<div style="margin-top:56px">' + figures(k) + '</div>';
    }
    return '<section class="dsec black"><div class="torn torn--top" data-color="paper" data-seed="' + (id.length + 3) + '"></div><div class="wrap">' + inner + '</div>' +
      '<div class="torn torn--bottom" data-color="paper" data-seed="' + (id.length + 9) + '"></div></section>';
  }

  function render() {
    if (!P) {
      root.innerHTML = '<section class="nf paper"><div><p class="nf__code">404</p><h1 class="nf__title">' + h(t('notfound.title')) + '</h1><p>' + h(t('notfound.text')) + '</p><a class="btn btn--red" href="index.html#projets">' + h(t('notfound.cta')) + '</a></div></section>';
      return;
    }
    var k = 'projects.items.' + P.id;
    var isCampaign = P.type === 'campaign';
    var idx = list.indexOf(P);
    var next = isCampaign ? list[0] : list[(idx + 1) % list.length];
    var back = isCampaign ? 'index.html#parascolaire' : 'index.html#projets';
    document.title = t(k + '.title') + ' — Hamza Jnah';

    root.innerHTML =
      '<section class="detail-hero paper"><span class="corner corner--tl coords">45.4397° N, 4.3872° E</span><span class="corner corner--tr">Portfolio 2027</span><div class="wrap">' +
        '<a class="back-link" href="' + back + '">' + h(t('common.back_home')) + '</a>' +
        '<p class="detail-hero__kind">' + h(t(k + '.kind')) + '</p>' +
        '<h1 class="detail-hero__title' + (isCampaign ? ' h-giant--red' : '') + '">' + h(t(k + '.title')) + '</h1>' +
        '<p class="detail-hero__tagline">' + h(t(k + '.tagline')) + '</p>' +
        '<p class="detail-hero__chips">' + chip(t('projects.types.' + P.type), 'chip--red') + chip(t(k + '.year')) +
          (P.group ? chip(t('common.group')) : '') + (P.ongoing ? chip('● ' + t('common.ongoing')) : '') + '</p>' +
      '</div></section>' +
      showcase(k) +
      facts(k) +
      (P.sketch ? '<section class="dsec black"><div class="torn torn--top" data-color="paper" data-seed="41"></div><div class="wrap"><h2 class="dsec__title">' + h(t('projects.labels.process')) + '</h2></div><div class="sketch-wrap" style="padding-top:10px">' + HJ.sketchSVG(k + '.sketch.') + '</div></section>' : '') +
      '<a class="next-project" href="projet.html?id=' + next.id + '"><span class="next-project__lbl">' + h(t('projects.labels.next')) + ' →</span><span class="next-project__title">' + h(t('projects.items.' + next.id + '.title')) + '</span></a>';

    HJ.torn(root);
    HJ.observe(root);

    // Active les boutons PDF seulement si le fichier existe dans le dépôt
    root.querySelectorAll('[data-pdf]').forEach(function (a) {
      HJ.exists(a.getAttribute('data-pdf')).then(function (ok) {
        if (ok) a.removeAttribute('aria-disabled');
        else {
          a.removeAttribute('href');
          a.insertAdjacentHTML('beforeend', ' · ' + h(t('common.soon')));
          a.insertAdjacentHTML('afterend', ' <mark class="todo">[À COMPLÉTER : ' + I18N.esc(a.getAttribute('data-pdf').split('/').pop()) + ']</mark>');
        }
      });
    });

    // Galeries cliquables
    root.querySelectorAll('[data-gal]').forEach(function (b) {
      b.addEventListener('click', function () {
        var imgs = Array.from(b.parentNode.querySelectorAll('img'));
        HJ.lightbox.open(imgs.map(function (im) { return { src: im.getAttribute('src'), alt: im.alt, caption: I18N.esc(im.alt) }; }), parseInt(b.getAttribute('data-gal'), 10));
      });
    });
  }

  HJ.site.then(function (site) {
    SITE = site;
    find();
    HJ.boot(function () {
      render();
      I18N.onChange(render);
    });
  });
})();
