/* =========================================================
   Accueil et « Hello » :
   - nom « HAMZA JNAH » à faire glisser (passe derrière le portrait, revient avec un ressort)
   - « Je crée [l'image / la vidéo / l'histoire / la marque] » : un effet par mot
   - étiquettes manuscrites autour du portrait
   - « Je suis Hamza » qui s'écrit au défilement
   - cartes « Ce que j'apporte » qui se retournent (toucher sur téléphone)
   Tout est coupé si « réduire les animations » est activé.
   ========================================================= */
(function () {
  'use strict';
  var reduce = function () { return HJ.reduce; };

  /* ---------- « HAMZA JNAH » : zone de texte à étirer, façon Canva ---------- */
  function nameBox() {
    var box = document.getElementById('namebox');
    var text = document.getElementById('hero-title');
    var handle = document.getElementById('namebox-handle');
    if (!box || !text || !handle) return;
    var PAD = 6, st = { w: 0, min: 0, one: 0, max: 0, base: 0, r1: 0 };
    var seen = false;
    try { seen = localStorage.getItem('hj-stretch') === '1'; } catch (e) {}
    if (!seen) box.classList.add('show-hint');

    function measure() {
      text.style.fontSize = '';
      st.base = parseFloat(getComputedStyle(text).fontSize);
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit;';
      text.appendChild(probe);
      probe.textContent = 'HAMZA JNAH'; var w1 = probe.offsetWidth;
      probe.textContent = 'HAMZA'; var w2 = probe.offsetWidth;
      text.removeChild(probe);
      st.r1 = w1 / st.base;
      st.min = Math.ceil(w2 + PAD * 2);
      st.one = Math.ceil(w1 + PAD * 2);
      // la zone ne dépasse jamais de l'écran (ni de l'accueil sur ordinateur)
      var left = box.getBoundingClientRect().left;
      var inner = document.querySelector('.hero__inner').getBoundingClientRect();
      st.max = Math.max(st.min, Math.min(window.innerWidth - 16, inner.right - 16) - left);
    }
    function apply(w) {
      st.w = w;
      box.style.width = w + 'px';
      var fs = st.base;
      // Sur petit écran, si « HAMZA JNAH » ne tient pas sur une ligne, le texte se réduit pour y tenir
      if (st.one > st.max && w > st.min + (st.max - st.min) * 0.45) fs = Math.min(st.base, (w - PAD * 2) / st.r1);
      text.style.fontSize = fs === st.base ? '' : fs.toFixed(1) + 'px';
      box.classList.toggle('is-one', w >= Math.min(st.one, st.max) - 2);
    }
    function init() { var wasOne = st.w && st.w >= st.one - 2; measure(); apply(wasOne ? Math.min(st.one, st.max) : st.min); }

    var drag = null;
    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, w: st.w };
      box.classList.remove('is-snap'); box.classList.add('is-drag');
      box.classList.add('used');
      try { localStorage.setItem('hj-stretch', '1'); } catch (er) {}
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var w = drag.w + (e.clientX - drag.x);
      if (w > st.max) w = st.max + (w - st.max) * 0.15;      // résistance au bord
      if (w < st.min) w = st.min - (st.min - w) * 0.3;
      apply(Math.max(st.min * 0.7, w));
    });
    function end() {
      if (!drag) return;
      drag = null;
      box.classList.remove('is-drag'); box.classList.add('is-snap');
      if (st.w < st.min) apply(st.min);            // revient en douceur
      else if (st.w > st.max) apply(st.max);
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); box.classList.add('is-snap', 'used');
      apply(Math.min(st.max, Math.max(st.min, st.w + (e.key === 'ArrowRight' ? 40 : -40))));
    });
    window.addEventListener('resize', function () { requestAnimationFrame(init); });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(init);
    init();
  }

  /* ---------- Machine à écrire : un effet par mot ---------- */
  var typeTimer = null, tcTimer = null;
  function typewriter() {
    var el = document.getElementById('typeword');
    if (!el) return;
    clearTimeout(typeTimer); clearInterval(tcTimer);
    var words = (I18N.t('hero.type_words') || []).map(I18N.clean);
    if (!words.length) return;
    function show(i) {
      clearInterval(tcTimer);
      var w = I18N.esc(words[i]);
      el.className = 'typeword fx-' + i;
      if (i === 1) {
        el.innerHTML = '<span class="rec" aria-hidden="true"><i></i>REC <b class="tc">00:00:00</b></span>' + w;
        var f = 0, tc = el.querySelector('.tc');
        if (!reduce()) tcTimer = setInterval(function () { f++; var s = Math.floor(f / 25); tc.textContent = '00:0' + Math.min(9, s) + ':' + ('0' + (f % 25)).slice(-2); }, 40);
      } else if (i === 3) {
        el.innerHTML = '<span class="stamp">' + w + '</span>';
      } else {
        el.innerHTML = '<span class="w">' + w + '</span>';
      }
      void el.offsetWidth; el.classList.add('is-on');
    }
    var i = 0;
    show(0);
    if (reduce()) return;
    (function loop() {
      typeTimer = setTimeout(function () { i = (i + 1) % words.length; show(i); loop(); }, 2300);
    })();
  }

  /* ---------- Étiquettes manuscrites ---------- */
  function tags() {
    var list = I18N.t('hero.tags') || [];
    document.querySelectorAll('#hero-tags .ftag span').forEach(function (s, i) { if (list[i]) s.textContent = list[i]; });
  }

  /* ---------- « Je suis Hamza » qui s'écrit au défilement ---------- */
  var sig = { letters: [] };
  function buildSig() {
    var t = document.getElementById('sig-text');
    if (!t) return;
    var text = I18N.clean(I18N.t('about.lead')) || t.textContent;
    t.innerHTML = Array.from(text).map(function (c) { return '<tspan>' + (c === ' ' ? ' ' : I18N.esc(c)) + '</tspan>'; }).join('');
    sig.letters = Array.from(t.querySelectorAll('tspan'));
    sig.update && sig.update();
  }
  function sigScroll() {
    var box = document.getElementById('sig');
    if (!box) return;
    sig.update = function () {
      var n = sig.letters.length;
      if (!n) return;
      if (reduce()) { sig.letters.forEach(function (l) { l.style.strokeDashoffset = 0; l.style.fillOpacity = 1; }); return; }
      var r = box.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.95 - r.top) / (vh * 0.4)));
      // Une fois écrite, la signature reste visible (et elle l'est aussi si on arrive plus bas)
      if (r.bottom < 0) p = 1;
      sig.max = Math.max(sig.max || 0, p); p = sig.max;
      sig.letters.forEach(function (l, i) {
        var lp = Math.min(1, Math.max(0, p * (n + 3) - i));
        l.style.strokeDashoffset = (300 * (1 - lp)).toFixed(1);
        l.style.fillOpacity = Math.max(0, lp * 2 - 1).toFixed(2);
      });
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(sig.update); }, { passive: true });
    sig.update();
  }

  /* ---------- Cartes qui se retournent (toucher / clavier) ---------- */
  function cards() {
    document.querySelectorAll('.bc').forEach(function (c) {
      c.addEventListener('click', function () { c.classList.toggle('is-flipped'); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('is-flipped'); } });
    });
    if (reduce()) {
      var a = document.getElementById('move-anim');
      if (a) a.remove();
    }
  }

  nameBox();
  sigScroll();
  cards();
  document.addEventListener('langchange', function () { typewriter(); tags(); buildSig(); });
})();
