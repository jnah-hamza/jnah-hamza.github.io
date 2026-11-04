/* =========================================================
   Portrait (accueil), carte « Hello » (3D ou carte qui se retourne),
   machine à écrire et étiquettes manuscrites de l'accueil.
   Bascule automatique :
   - assets/img/portrait.png (ou portrait.png à la racine) : portrait détouré avec contour rouge
   - sinon portrait.jpg : photo dans un cadre polaroïd
   - moi-3d.glb (racine ou assets/3d/) : modèle 3D dans le cadre « Hello »
   ========================================================= */
(function () {
  'use strict';

  var MODEL_VIEWER = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';

  function firstExisting(list) {
    list = (list || []).slice();
    return new Promise(function (res) {
      (function next() {
        if (!list.length) return res(null);
        var url = list.shift();
        HJ.exists(url).then(function (ok) { ok ? res(url) : next(); });
      })();
    });
  }
  function loadImg(url) {
    return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(url); }; i.onerror = rej; i.src = url; });
  }

  /* ---------- Portrait de l'accueil ---------- */
  function heroPortrait(cfg) {
    var box = document.getElementById('hero-portrait');
    var img = document.getElementById('hero-portrait-img');
    var flipImg = document.getElementById('flip-img');
    if (!box || !img) return;
    firstExisting(cfg.cutout).then(function (cut) {
      if (cut) return loadImg(cut).then(function () {
        img.src = cut; box.classList.remove('is-photo'); box.classList.add('is-cutout');
        if (flipImg) flipImg.src = cut;
      });
      return firstExisting(cfg.photo).then(function (ph) {
        if (!ph) return;
        return loadImg(ph).then(function () { img.src = ph; if (flipImg) flipImg.src = ph; });
      });
    }).catch(function () {});
  }

  /* ---------- Carte « Hello » : modèle 3D ou carte qui se retourne ---------- */
  function hello(cfg) {
    var wrap = document.getElementById('me3d');
    var stage = document.getElementById('me3d-stage');
    var card = document.getElementById('flipcard');
    if (!wrap || !stage) return;

    if (card) {
      card.addEventListener('click', function () {
        var on = card.getAttribute('aria-pressed') !== 'true';
        card.setAttribute('aria-pressed', on ? 'true' : 'false');
        card.classList.toggle('is-flipped', on);
      });
      if (HJ.fine && !HJ.reduce) {
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
          card.style.setProperty('--ry', (x * 20).toFixed(1) + 'deg');
        });
        card.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
      }
    }

    // Le modèle 3D ne se charge que quand la section arrive à l'écran
    var started = false;
    function tryModel() {
      if (started) return; started = true;
      firstExisting(cfg.model).then(function (glb) {
        if (!glb) return;
        var s = document.createElement('script');
        s.type = 'module'; s.src = MODEL_VIEWER;
        s.onload = function () {
          var mv = document.createElement('model-viewer');
          mv.setAttribute('src', glb);
          mv.setAttribute('alt', I18N.t('about.model_alt') || 'Hamza Jnah 3D');
          mv.setAttribute('camera-controls', '');
          mv.setAttribute('disable-zoom', '');
          mv.setAttribute('disable-pan', '');
          mv.setAttribute('touch-action', 'pan-y');
          mv.setAttribute('interaction-prompt', 'none');
          mv.setAttribute('exposure', '1');
          mv.setAttribute('shadow-intensity', '0');
          mv.setAttribute('environment-image', 'neutral');
          mv.setAttribute('loading', 'lazy');
          if (!HJ.reduce) { mv.setAttribute('auto-rotate', ''); mv.setAttribute('auto-rotate-delay', '0'); mv.setAttribute('rotation-per-second', '18deg'); }
          mv.className = 'me3d__model';
          // Le modèle se charge en arrière-plan, puis remplace la carte
          mv.style.position = 'absolute'; mv.style.opacity = '0';
          stage.appendChild(mv);
          mv.addEventListener('load', function () {
            if (card) card.remove();
            mv.style.position = ''; mv.style.opacity = '';
            wrap.classList.add('has-model');
          }, { once: true });
        };
        document.head.appendChild(s);
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); tryModel(); } }, { rootMargin: '400px 0px' });
      io.observe(wrap);
      // Sécurité si l'observateur ne se déclenche pas
      window.addEventListener('scroll', function onS() {
        var r = wrap.getBoundingClientRect();
        if (r.top < window.innerHeight + 400) { window.removeEventListener('scroll', onS); tryModel(); }
      }, { passive: true });
    } else tryModel();
  }

  /* ---------- Machine à écrire : « Je crée [l'image / la vidéo / …] » ---------- */
  var typeTimer = null;
  function typewriter() {
    var el = document.getElementById('typeword');
    if (!el) return;
    clearTimeout(typeTimer);
    var words = I18N.t('hero.type_words') || [];
    if (!words.length) return;
    var i = 0;
    el.textContent = words[0];
    if (HJ.reduce) return;
    function erase(cb) {
      var w = el.textContent;
      (function step() {
        if (!w.length) return cb();
        w = w.slice(0, -1); el.textContent = w;
        typeTimer = setTimeout(step, 35);
      })();
    }
    function type(word, cb) {
      var k = 0;
      (function step() {
        el.textContent = word.slice(0, ++k);
        if (k < word.length) typeTimer = setTimeout(step, 55); else cb();
      })();
    }
    (function loop() {
      typeTimer = setTimeout(function () {
        erase(function () { i = (i + 1) % words.length; type(words[i], loop); });
      }, 1400);
    })();
  }

  /* ---------- Étiquettes manuscrites autour du portrait ---------- */
  function tags() {
    var list = I18N.t('hero.tags') || [];
    document.querySelectorAll('#hero-tags .ftag span').forEach(function (s, i) { if (list[i]) s.textContent = list[i]; });
  }

  HJ.site.then(function (site) {
    var cfg = site.portrait || {};
    heroPortrait(cfg);
    hello(cfg);
  });
  document.addEventListener('langchange', function () { typewriter(); tags(); });
})();
