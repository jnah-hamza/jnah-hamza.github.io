/* =========================================================
   Traductions FR / EN
   Les textes sont dans lang/fr.json et lang/en.json.
   ========================================================= */
(function () {
  'use strict';

  var BASE = window.HJ_BASE || '';
  var KEY = 'hj-lang';
  var cache = {};
  var listeners = [];

  function detect() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (e) {}
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr';
    return /^en\b/i.test(nav) ? 'en' : 'fr';
  }

  function load(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(BASE + 'lang/' + lang + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { cache[lang] = d; return d; });
  }

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Les textes provisoires « [À COMPLÉTER …] » ne sont jamais affichés sur le site */
  function clean(s) { return String(s == null ? '' : s).replace(/\s*\[À COMPLÉTER[^\]]*\]/g, '').trim(); }
  function html(s) { return esc(clean(s)); }

  var I18N = {
    lang: detect(),
    dict: {},
    t: function (path, vars) {
      var v = get(I18N.dict, path);
      if (v === undefined) v = get(cache.fr || {}, path);
      if (v === undefined) return '';
      if (typeof v === 'string' && vars) {
        v = v.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
      }
      return v;
    },
    html: html,
    esc: esc,
    /* Remplit un élément avec un texte (sécurisé), en marquant les [À COMPLÉTER] */
    clean: clean,
    fill: function (el, text) {
      if (!el) return;
      el.textContent = clean(text);
    },
    apply: function (root) {
      root = root || document;
      root.querySelectorAll('[data-i18n]').forEach(function (el) {
        var v = I18N.t(el.getAttribute('data-i18n'));
        if (typeof v !== 'string' || v === '') return;
        if (el.classList.contains('reveal-letters') && el.__letters) { el.__letters(clean(v)); return; }
        I18N.fill(el, v);
      });
      root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          var p = pair.split(':');
          var v = I18N.t(p[1].trim());
          if (v) el.setAttribute(p[0].trim(), v);
        });
      });
    },
    set: function (lang) {
      if (lang !== 'fr' && lang !== 'en') lang = 'fr';
      return load(lang).then(function (d) {
        I18N.lang = lang;
        I18N.dict = d;
        try { localStorage.setItem(KEY, lang); } catch (e) {}
        document.documentElement.lang = lang;
        I18N.apply();
        document.querySelectorAll('[data-lang]').forEach(function (b) {
          var on = b.getAttribute('data-lang') === lang;
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          b.classList.toggle('is-active', on);
        });
        var t = I18N.t(document.body.getAttribute('data-title-key') || 'meta.title');
        if (t) document.title = t;
        var desc = document.querySelector('meta[name="description"]');
        if (desc && I18N.t('meta.description') && !document.body.hasAttribute('data-title-key')) desc.setAttribute('content', I18N.t('meta.description'));
        listeners.forEach(function (fn) { try { fn(lang); } catch (e) { console.error(e); } });
        document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
        return d;
      });
    },
    onChange: function (fn) { listeners.push(fn); },
    init: function () {
      document.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lang]');
        if (!b) return;
        e.preventDefault();
        I18N.set(b.getAttribute('data-lang'));
      });
      /* Le français sert de secours si une clé manque en anglais */
      var p = load('fr');
      return (I18N.lang === 'fr' ? p : p.then(function () { return load(I18N.lang); }, function () { return load(I18N.lang); }))
        .then(function () { return I18N.set(I18N.lang); })
        .catch(function (e) { console.warn('Traductions indisponibles', e); });
    }
  };

  window.I18N = I18N;
})();
