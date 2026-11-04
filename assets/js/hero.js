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

  /* ---------- Nom à faire glisser ---------- */
  function dragName() {
    var box = document.getElementById('dragname');
    var hint = document.getElementById('drag-hint');
    if (!box) return;
    var seen = false;
    try { seen = localStorage.getItem('hj-drag') === '1'; } catch (e) {}
    if (!seen && !reduce()) box.classList.add('show-hint');
    if (reduce()) return;
    var x0 = 0, dx = 0, active = false, id = null;
    function max() { return Math.max(120, window.innerWidth * 0.55); }
    box.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      active = true; id = e.pointerId; x0 = e.clientX - dx;
      box.classList.add('is-drag'); box.classList.remove('is-back');
    });
    window.addEventListener('pointermove', function (e) {
      if (!active || e.pointerId !== id) return;
      var raw = e.clientX - x0;
      // résistance élastique au-delà des limites
      dx = raw > max() ? max() + (raw - max()) * 0.2 : raw < -30 ? -30 + (raw + 30) * 0.2 : raw;
      box.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,0,0) rotate(' + (dx * 0.006).toFixed(2) + 'deg)';
      if (Math.abs(dx) > 8) {
        box.classList.add('has-moved');
        try { localStorage.setItem('hj-drag', '1'); } catch (er) {}
      }
    }, { passive: true });
    function release() {
      if (!active) return;
      active = false; dx = 0;
      box.classList.remove('is-drag'); box.classList.add('is-back');
      box.style.transform = '';
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    if (hint) hint.addEventListener('animationend', function () {});
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

  dragName();
  sigScroll();
  cards();
  document.addEventListener('langchange', function () { typewriter(); tags(); buildSig(); });
})();
