/* =========================================================
   Contenu d'un projet (utilisé par la fenêtre pop-up de l'accueil
   et par la page projet.html). Mise en page selon le type :
   mix_report (911 Sellier), mix_media (Sephora), brand (Aballa).
   Les éléments incomplets (lien manquant, PDF absent…) sont masqués.
   ========================================================= */
(function () {
  'use strict';
  var t = function (k, v) { return I18N.t(k, v); };
  var h = function (s) { return I18N.html(s); };
  var has = function (s) { return !!I18N.clean(s); };
  var P = null;

  function chip(text, cls) { return has(text) ? '<span class="chip ' + (cls || '') + '">' + h(text) + '</span>' : ''; }
  function sec(cls, inner, seed) {
    var first = / first/.test(cls); cls = cls.replace(' first', '');
    return '<section class="dsec ' + cls + '">' +
      (cls === 'black' && !first ? '<div class="torn torn--top" data-color="paper" data-seed="' + seed + '"></div>' : '') +
      '<div class="wrap">' + inner + '</div>' +
      (cls === 'black' ? '<div class="torn torn--bottom" data-color="paper" data-seed="' + (seed + 5) + '"></div>' : '') + '</section>';
  }

  function facts(k, keys) {
    var out = keys.map(function (x) {
      var v = t(k + '.' + x[0]);
      if (!has(v)) return '';
      return '<div class="fact ' + (x[2] || '') + ' rv"><span class="fact__lbl">' + h(t('projects.labels.' + x[1])) + '</span><p>' + h(v) + '</p></div>';
    }).join('');
    var tools = (t(k + '.tools') || []).filter(has);
    if (tools.length) out += '<div class="fact fact--wide rv"><span class="fact__lbl">' + h(t('projects.labels.tools')) + '</span><div class="tools-row">' + tools.map(function (x) { return chip(x); }).join('') + '</div></div>';
    return out ? '<div class="facts">' + out + '</div>' : '';
  }

  function figures(k) {
    var f = (t(k + '.figures') || []).filter(function (x) { return has(x.value); });
    if (!f.length) return '';
    return '<h2 class="dsec__title">' + h(t('projects.labels.figures')) + '</h2><div class="figures">' +
      f.map(function (x, i) {
        return '<div class="figure rv" style="--d:' + (i * 90) + 'ms"><strong' + (String(x.value).length > 4 ? ' class="is-long"' : '') + '>' + h(x.value) + '</strong><span>' + h(x.label) + '</span></div>';
      }).join('') + '</div>';
  }

  function pages(arr) {
    if (!arr || !arr.length) return '';
    return '<h2 class="dsec__title">' + h(t('projects.labels.pages')) + '</h2><div class="pages" tabindex="0">' + arr.map(function (src, i) {
      return '<button type="button" class="pages__img" data-gal="' + i + '"><img src="' + src + '" alt="' + I18N.esc(t('projects.labels.pages') + ' ' + (i + 1)) + '" loading="lazy" width="910" height="1287"></button>';
    }).join('') + '</div>';
  }

  /* Boutons : un PDF n'apparaît que s'il existe vraiment */
  function pdfBtn(file, label) {
    return file ? '<a class="btn btn--red" data-pdf="' + file + '" href="' + file + '" download hidden>' + h(label) + '</a>' : '';
  }
  function linkBtn(url, label, cls) {
    return url ? '<a class="btn ' + (cls || 'btn--outline-light') + '" href="' + url + '" target="_blank" rel="noopener">' + h(label) + ' ↗<span class="sr-only"> ' + h(t('common.new_tab')) + '</span></a>' : '';
  }
  function ytFrame(idv, title) {
    return '<div class="video-big"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(idv) + '?rel=0" title="' + I18N.esc(title) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
  }
  function photoPola(folder, file, w, hh, caption, tilt) {
    return HJ.polaroid({ thumb: 'assets/img/' + folder + '/thumbs/' + file + '.webp', alt: caption, caption: caption, w: w, h: hh, tilt: tilt || -3, size: 'l', button: true, index: 0 }) ;
  }

  /* ---------- En-têtes ---------- */
  function heroPaper(k, back, extraCls, extraHTML) {
    var chips = (t(k + '.chips') || []).map(function (c) { return chip(c); }).join('');
    return '<section class="detail-hero paper ' + (extraCls || '') + '"><span class="corner corner--tl coords">45.4397° N, 4.3872° E</span><span class="corner corner--tr">Portfolio 2027</span><div class="wrap">' +
      (back ? '<a class="back-link" href="' + back + '">' + h(t('common.back_home')) + '</a>' : '') +
      (extraHTML || '') +
      '<p class="detail-hero__kind">' + h(t(k + '.kind')) + '</p>' +
      '<h1 class="detail-hero__title" id="pmodal-title">' + h(t(k + '.title')) + '</h1>' +
      '<p class="detail-hero__tagline">' + h(t(k + '.tagline')) + '</p>' +
      '<p class="detail-hero__chips">' + chip(t('projects.categories.' + P.category), 'chip--red') + chip(t(k + '.year')) + chips + '</p>' +
      '</div></section>';
  }
  function heroImage(k, back) {
    var chips = (t(k + '.chips') || []).map(function (c) { return chip(c); }).join('');
    return '<section class="detail-cover"><div class="detail-cover__bg" data-parallax="0.15" style="background-image:url(\'' + P.cover + '\')"></div>' +
      '<span class="corner corner--tl coords">48.7758° N, 9.1829° E</span><span class="corner corner--tr">Portfolio 2027</span>' +
      '<div class="wrap detail-cover__in">' +
        (back ? '<a class="back-link" href="' + back + '">' + h(t('common.back_home')) + '</a>' : '') +
        '<p class="detail-hero__kind">' + h(t(k + '.kind')) + '</p>' +
        '<h1 class="detail-cover__title" id="pmodal-title">' + h(t(k + '.title')) + '</h1>' +
        '<p class="detail-hero__tagline">' + h(t(k + '.tagline')) + '</p>' +
        '<p class="detail-hero__chips">' + chip(t('projects.categories.' + P.category), 'chip--red') + chip(t(k + '.year')) + chips + '</p>' +
      '</div>' +
      '<p class="detail-cover__note">' + h(t('projects.labels.concept_visual')) + '</p>' +
      '<div class="torn torn--bottom" data-color="black" data-seed="61"></div></section>';
  }

  /* ---------- Contenus selon le type ---------- */
  function bodyMixReport(k) {
    var steps = (t(k + '.steps') || []).filter(has);
    var launch = t(k + '.launch') || [];
    var html = sec('black first', figures(k) + '<div class="concept rv"><span class="fact__lbl">' + h(t('projects.labels.concept')) + '</span><p>' + h(t(k + '.concept')) + '</p></div>', 62);
    html += sec('paper', facts(k, [['context', 'context', 'fact--wide'], ['role', 'role', 'fact--red'], ['output', 'output']]) +
      (steps.length ? '<h2 class="dsec__title" style="margin-top:64px">' + h(t('projects.labels.steps')) + '</h2><ol class="steps">' + steps.map(function (s, i) { return '<li class="rv" style="--d:' + (i * 70) + 'ms"><span>0' + (i + 1) + '</span>' + h(s) + '</li>'; }).join('') + '</ol>' : '') +
      (launch.length ? '<h2 class="dsec__title" style="margin-top:64px">' + h(t('projects.labels.launch')) + '</h2><ol class="launch">' + launch.map(function (s) { return '<li class="rv"><strong>' + h(s.date) + '</strong><span>' + h(s.text) + '</span></li>'; }).join('') + '</ol>' : ''));
    html += sec('black', pages(P.pages) + '<div class="cta-row">' + pdfBtn(P.pdf, t('projects.labels.pdf')) + linkBtn(P.canva, t('projects.labels.canva')) + '</div>', 63);
    if (P.sketch) html += '<section class="dsec black"><div class="torn torn--top" data-color="paper" data-seed="64"></div><div class="wrap"><h2 class="dsec__title">' + h(t('projects.labels.process')) + '</h2></div><div class="sketch-wrap" style="padding-top:10px">' + HJ.sketchSVG(k + '.sketch.') + '</div></section>';
    return html;
  }

  function bodyMixMedia(k) {
    var ph = P.photo;
    var media = '<div class="case-media">' +
      (ph ? '<div class="case-media__photo">' + photoPola('projets', ph.file, ph.w, ph.h, t(k + '.photo_caption'), -3) + '</div>' : '') +
      '<div class="case-media__text"><span class="fact__lbl">' + h(t('projects.labels.concept')) + '</span><p class="case-media__concept">' + h(t(k + '.concept')) + '</p>' +
      (P.youtube ? '<h2 class="dsec__title" style="margin-top:36px">' + h(t('projects.labels.video_intro')) + '</h2>' + ytFrame(P.youtube, t(k + '.title')) : '') +
      '</div></div>';
    return sec('paper case-file', media, 70) +
      sec('black', figures(k), 71) +
      sec('paper', facts(k, [['context', 'context', 'fact--wide'], ['role', 'role', 'fact--red'], ['output', 'output']]), 72);
  }

  function bodyBrand(k) {
    var g = P.gallery || [];
    var gal = g.length ? '<h2 class="dsec__title">' + h(t('projects.labels.gallery')) + '</h2><div class="gallery">' + g.map(function (src, i) {
      return '<button type="button" data-gal="' + i + '"><img src="' + src + '" alt="' + I18N.esc(t(k + '.title') + ' — ' + (i + 1)) + '" loading="lazy"></button>';
    }).join('') + '</div>' : '';
    return sec('black', gal + figures(k), 80) +
      sec('paper', facts(k, [['context', 'context', 'fact--wide'], ['problem', 'problem'], ['role', 'role', 'fact--red'], ['output', 'output'], ['result', 'result']]), 81);
  }

  /* Sephora : page « journal vintage / dossier d'enquête » */
  function journal(k) {
    var L = function (x) { return h(t('projects.labels.' + x)); };
    var figs = (t(k + '.figures') || []);
    var inv = t(k + '.investigation') || [], axes = t(k + '.axes') || [], cr = t(k + '.creative') || [];
    var ph = P.photo;
    var btns = '<div class="np-btns">' + pdfBtn(P.pdf, t('projects.labels.report')).replace(' download hidden', ' target="_blank" rel="noopener" hidden') +
      linkBtn(P.canva, t('projects.labels.canva_pres'), 'btn--np') + linkBtn(P.canva2, t('projects.labels.canva_bot'), 'btn--np') + '</div>';
    var role = has(t(k + '.role')) ? '<p class="np-role"><strong>' + h(t('projects.labels.role')) + ' :</strong> ' + h(t(k + '.role')) + '</p>' : '';
    return '<article class="np">' +
      '<div class="np__cover"><img src="' + P.cover + '" alt="" loading="lazy"><span class="np__stamp" aria-hidden="true">' + h(t(k + '.stamp')) + '</span></div>' +
      '<header class="np__mast"><p class="np__edition"><span>Special Edition</span><span>' + h(t(k + '.year')) + '</span><span>ENCG Settat</span></p>' +
        '<p class="np__name">' + h(t(k + '.masthead')) + '</p>' +
        '<h1 class="np__headline" id="pmodal-title">' + h(t(k + '.title')) + '</h1>' +
        '<p class="np__deck">' + h(t(k + '.tagline')) + '</p>' +
        '<p class="np__chips">' + chip(t('projects.categories.' + P.category), 'chip--red') + chip(t(k + '.year')) + (t(k + '.chips') || []).map(function (c) { return chip(c); }).join('') + '</p></header>' +
      '<div class="np__figs">' + figs.map(function (f) { return '<div class="rv"><strong>' + h(f.value) + '</strong><span>' + h(f.label) + '</span></div>'; }).join('') + '</div>' +
      '<div class="np__cols">' +
        '<section class="np__col"><h2 class="np__h">' + L('context') + '</h2><p class="np__drop">' + h(t(k + '.context')) + '</p>' + role +
          '<h2 class="np__h">' + L('question') + '</h2><blockquote class="np__quote">' + h(t(k + '.question')) + '</blockquote>' +
          '<h2 class="np__h">' + L('investigation') + '</h2><ul class="np__list">' + inv.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></section>' +
        '<section class="np__col"><h2 class="np__h">' + L('verdict') + '</h2><p class="np__verdict">' + h(t(k + '.verdict')) + '</p>' +
          '<h2 class="np__h">' + L('strategy') + '</h2><p>' + h(t(k + '.strategy')) + '</p><ol class="np__axes">' + axes.map(function (x, i) { return '<li><b>0' + (i + 1) + '</b><span><strong>' + h(x.t) + '</strong> ' + h(x.d) + '</span></li>'; }).join('') + '</ol>' +
          '<p class="np__msg">' + h(t(k + '.message')) + '</p><p class="np__plan">' + h(t(k + '.plan')) + '</p></section>' +
      '</div>' +
      '<section class="np__creative"><h2 class="np__h">' + L('creative') + '</h2><div class="np__ads">' + cr.map(function (x) { return '<div class="np__ad"><h3>' + h(x.t) + '</h3><p>' + h(x.d) + '</p></div>'; }).join('') + '</div></section>' +
      (ph ? '<figure class="np__photo">' + photoPola('projets', ph.file, ph.w, ph.h, t(k + '.photo_caption'), -2) + '</figure>' : '') +
      '<section class="np__pages"><h2 class="np__h">' + L('pages') + '</h2>' + pages(P.pages).replace(/<h2 class="dsec__title">[^<]*<\/h2>/, '') + '</section>' +
      btns +
    '</article>';
  }
  /* Aballa : lookbook de grandes photos verticales */
  function lookbook(k) {
    var g = P.gallery || [];
    var gal = g.length ? '<h2 class="dsec__title">' + h(t('projects.labels.lookbook')) + '</h2><div class="lookbook">' + g.map(function (src, i) {
      return '<button type="button" data-gal="' + i + '" class="rv" style="--d:' + (i * 90) + 'ms"><img src="' + src + '" alt="' + I18N.esc(I18N.clean(t(k + '.title')) + ' — ' + (i + 1)) + '" loading="lazy"></button>';
    }).join('') + '</div>' : '';
    return sec('black', gal + '<p class="lookbook__txt">' + h(t(k + '.tagline')) + '</p>', 80);
  }

  /* Renvoie le HTML complet d'un projet */
  HJ.projectHTML = function (project, list, back) {
    P = project;
    var k = 'projects.items.' + P.id;
    var idx = list.indexOf(P);
    var next = list[(idx + 1) % list.length];
    var head, body;
    if (P.type === 'mix_report') { head = heroImage(k, back); body = bodyMixReport(k); }
    else if (P.type === 'mix_media') {
      head = heroPaper(k, back, 'case-hero', '<span class="case-tape" aria-hidden="true"></span><p class="case-label">' + h(t(k + '.case')) + '</p><span class="case-stamp" aria-hidden="true">' + h(t(k + '.stamp')) + '</span>');
      body = bodyMixMedia(k);
    }
    else if (P.type === 'journal') { head = ''; body = journal(k); }
    else { head = heroPaper(k, back); body = P.gallery && P.gallery.length ? lookbook(k) : bodyBrand(k); }
    return head + body +
      '<a class="next-project" href="projet.html?id=' + next.id + '" data-project="' + next.id + '"><span class="next-project__lbl">' + h(t('projects.labels.next')) + ' →</span><span class="next-project__title">' + h(t('projects.items.' + next.id + '.title')) + '</span></a>';
  };

  /* Active les boutons, galeries et animations d'un projet affiché */
  HJ.bindProject = function (root) {
    HJ.torn(root);
    HJ.observe(root);
    root.querySelectorAll('[data-pdf]').forEach(function (a) {
      HJ.exists(a.getAttribute('data-pdf')).then(function (ok) { if (ok) a.hidden = false; else a.remove(); });
    });
    root.querySelectorAll('.pages, .gallery, .lookbook').forEach(function (g) {
      var imgs = Array.from(g.querySelectorAll('img'));
      g.querySelectorAll('[data-gal]').forEach(function (b) {
        b.addEventListener('click', function () {
          HJ.lightbox.open(imgs.map(function (im) { return { src: im.getAttribute('src'), alt: im.alt, caption: I18N.esc(im.alt) }; }), parseInt(b.getAttribute('data-gal'), 10));
        });
      });
    });
    root.querySelectorAll('.polaroid[data-index]').forEach(function (b) {
      b.addEventListener('click', function () {
        var im = b.querySelector('img');
        HJ.lightbox.open([{ src: im.getAttribute('src').replace('/thumbs/', '/'), alt: im.alt, caption: I18N.esc(im.alt) }], 0);
      });
    });
  };
})();
