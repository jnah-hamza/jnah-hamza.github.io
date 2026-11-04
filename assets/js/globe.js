/* =========================================================
   PHOTOGRAPHIE — le globe 3D (Three.js) + carte plate de secours
   Données : data/photos.json (lieux, photos) et data/land-dots.json
   Textes : lang/fr.json et lang/en.json (photo.*)
   ========================================================= */

const sec = document.getElementById('globe-sec');
if (sec) start();

const FLAGS = { ma: '🇲🇦', fr: '🇫🇷', ch: '🇨🇭' };
const REGIONS = {
  maroc: { lat: 34.38, lon: -5.79, flags: '🇲🇦' },
  alpes: { lat: 45.82, lon: 5.63, flags: '🇫🇷🇨🇭' }
};
const ROUTE = ['casablanca', 'saint-etienne', 'chamonix', 'geneve'];
const DEG = Math.PI / 180;

function t(k, v) { return window.I18N ? I18N.t(k, v) : ''; }
function esc(s) { return window.I18N ? I18N.esc(s) : String(s); }
function waitI18n() {
  return new Promise((res) => {
    if (window.I18N && I18N.dict && I18N.dict.photo) return res();
    document.addEventListener('langchange', () => res(), { once: true });
  });
}

async function start() {
  const view = document.getElementById('globe-view');
  const stage = document.getElementById('globe-stage');
  const panel = document.getElementById('place-panel');
  const pills = document.getElementById('place-pills');
  const labels = document.getElementById('globe-labels');
  const canvas = document.getElementById('globe-canvas');
  const backBtn = document.getElementById('globe-back');
  const countEl = document.getElementById('photo-count');
  const loading = document.getElementById('globe-loading');

  const [data, dots] = await Promise.all([
    fetch('data/photos.json').then((r) => r.json()),
    fetch('data/land-dots.json').then((r) => r.json())
  ]);
  await waitI18n();

  /* Photos à publier (une photo peut attendre l'accord de la personne photographiée) */
  const places = data.places.map((p) => ({ ...p, photos: p.photos.filter((ph) => ph.consent !== false) }));
  const byId = Object.fromEntries(places.map((p) => [p.id, p]));
  const order = places.map((p) => p.id);
  const regionCount = (r) => places.filter((p) => p.region === r).reduce((s, p) => s + p.photos.length, 0);

  const state = { place: null, region: null, mode: null };
  let engine = null; // moteur 3D ou carte plate

  /* ---------- Compteur + pastilles ---------- */
  function renderCounter() {
    const total = places.reduce((s, p) => s + p.photos.length, 0);
    const countries = new Set(places.map((p) => p.country)).size;
    countEl.textContent = t('photo.counter', { photos: total, places: places.length, countries });
  }
  function photosLabel(n) { return n + ' ' + (n > 1 ? t('photo.photos') : t('photo.photo')); }

  function renderPills() {
    const groups = ['ma', 'fr', 'ch'];
    pills.innerHTML = groups.map((c) => {
      const list = places.filter((p) => p.country === c);
      return '<div class="place-pills__group"><span class="place-pills__country">' + FLAGS[c] + ' ' + esc(t('photo.countries.' + c)) + '</span>' +
        list.map((p) => '<button type="button" class="place-pill" data-place="' + p.id + '"' + (state.place === p.id ? ' aria-current="true"' : '') + '>' +
          esc(t('photo.places.' + p.id)) + '<small>' + p.photos.length + '</small></button>').join('') + '</div>';
    }).join('');
  }
  pills.addEventListener('click', (e) => {
    const b = e.target.closest('[data-place]');
    if (b) openPlace(b.getAttribute('data-place'), true);
  });

  /* ---------- Marqueurs HTML (accessibles au clavier) ---------- */
  function buildMarkers() {
    labels.innerHTML =
      Object.keys(REGIONS).map((r) =>
        '<button type="button" class="gl gl-bubble" data-region="' + r + '">' +
        esc(t('photo.regions.' + r)) + ' ' + REGIONS[r].flags + ' <small>· ' + esc(photosLabel(regionCount(r))) + '</small></button>').join('') +
      places.map((p) => {
        const s = Math.round(10 + Math.sqrt(p.photos.length) * 3.2);
        return '<button type="button" class="gl gl-place is-hidden" data-place="' + p.id + '" style="--s:' + s + 'px" aria-label="' +
          esc(t('photo.places.' + p.id) + ' · ' + photosLabel(p.photos.length)) + '">' +
          '<span class="gl-place__dot"></span><span class="gl-place__lbl">' + FLAGS[p.country] + ' ' + esc(t('photo.places.' + p.id)) +
          ' <em>· ' + esc(photosLabel(p.photos.length)) + '</em>' +
          (p.home ? '<span class="gl-place__home">' + esc(t('photo.home_badge')) + '</span>' : '') + '</span></button>';
      }).join('');
    labels.querySelectorAll('.gl-place__lbl').forEach((l) => { l.__w = 0; });
  }
  labels.addEventListener('click', (e) => {
    const b = e.target.closest('[data-region]');
    if (b) { goRegion(b.getAttribute('data-region'), e.detail === 0); return; }
    const p = e.target.closest('[data-place]');
    if (p) openPlace(p.getAttribute('data-place'));
  });

  /* Place les étiquettes sans qu'elles se chevauchent */
  function declutter(items) {
    const rects = [];
    const dotsR = items.map((it) => ({ x: it.x - it.r, y: it.y - it.r, w: it.r * 2, h: it.r * 2 }));
    const hit = (a, b) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
    items.sort((a, b) => b.n - a.n).forEach((it, idx) => {
      const lbl = it.el.querySelector('.gl-place__lbl');
      if (!lbl.__w) { lbl.__w = lbl.offsetWidth || 90; lbl.__h = lbl.offsetHeight || 22; }
      const w = lbl.__w, h = lbl.__h, g = it.r + 5;
      const cands = [
        [g, -h / 2], [-g - w, -h / 2], [-w / 2, -g - h], [-w / 2, g],
        [g, -h - 2], [g, 2], [-g - w, -h - 2], [-g - w, 2],
        [g + 10, -h / 2 - 26], [g + 10, h / 2 + 4], [-w / 2, -g - h - 24], [-w / 2, g + 24],
        [-g - w - 10, -h / 2 - 26], [-g - w - 10, h / 2 + 4], [g + 18, -h / 2 - 50], [-g - w - 18, h / 2 + 28]
      ];
      let best = null, bestScore = Infinity;
      for (const [dx, dy] of cands) {
        const r = { x: it.x + dx, y: it.y + dy, w, h };
        let score = 0;
        for (const o of rects) if (hit(r, o)) score += 10;
        dotsR.forEach((d, j) => { if (j !== idx && hit(r, d)) score += 3; });
        if (r.x < 4 || r.y < 4 || r.x + w > it.W - 4 || r.y + h > it.H - 4) score += 6;
        if (score < bestScore) { bestScore = score; best = [dx, dy, r]; }
        if (score === 0) break;
      }
      rects.push(best[2]);
      lbl.style.transform = 'translate(' + best[0].toFixed(0) + 'px,' + best[1].toFixed(0) + 'px)';
    });
  }

  /* ---------- Panneau d'un lieu ---------- */
  function photoCaption(ph) { return t('photo.captions.' + ph.file); }
  function renderPanel() {
    const p = byId[state.place];
    if (!p) return;
    const tilts = [-3, 4, -5, 2, -2, 5, -4, 3];
    const grid = p.photos.map((ph, i) => HJ.polaroid({
      thumb: 'assets/img/photos/thumbs/' + ph.file + '.webp',
      alt: t('photo.alts.' + ph.file), caption: photoCaption(ph),
      w: ph.w, h: ph.h, tilt: tilts[i % tilts.length], size: i === 0 ? 'big' : '', button: true, index: i
    })).join('');
    panel.innerHTML =
      '<div class="pp">' +
        '<div class="pp__top">' +
          '<p class="pp__country">' + FLAGS[p.country] + ' ' + esc(t('photo.countries.' + p.country)) + '</p>' +
          '<div class="pp__nav">' +
            '<button type="button" class="pp__btn" data-step="-1" aria-label="' + esc(t('photo.prev')) + '" title="' + esc(t('photo.prev')) + '">←</button>' +
            '<button type="button" class="pp__btn" data-step="1" aria-label="' + esc(t('photo.next')) + '" title="' + esc(t('photo.next')) + '">→</button>' +
            '<button type="button" class="pp__btn pp__btn--close" data-close aria-label="' + esc(t('photo.close_panel')) + '" title="' + esc(t('photo.close_panel')) + '">×</button>' +
          '</div></div>' +
        '<h3 class="pp__name" tabindex="-1">' + esc(t('photo.places.' + p.id)) + '</h3>' +
        '<div class="pp__meta"><span class="pp__count">' + esc(photosLabel(p.photos.length)) + '</span>' +
          (p.home ? '<span class="pp__home">' + esc(t('photo.home_badge')) + '</span>' : '') + '</div>' +
        '<div class="pp__grid">' + grid + '</div>' +
        '<a class="pp__insta" href="' + data.instagram + '" target="_blank" rel="noopener">' + esc(t('photo.more_insta')) +
          '<span class="sr-only"> ' + esc(t('common.new_tab')) + '</span></a>' +
      '</div>';
    HJ.observe(panel);
  }
  panel.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]');
    if (s) { step(parseInt(s.getAttribute('data-step'), 10)); return; }
    if (e.target.closest('[data-close]')) { closePlace(); return; }
    const pol = e.target.closest('.polaroid[data-index]');
    if (pol) {
      const p = byId[state.place];
      HJ.lightbox.open(p.photos.map((ph) => ({
        src: 'assets/img/photos/' + ph.file + '.webp',
        alt: t('photo.alts.' + ph.file),
        caption: esc(photoCaption(ph)) + '<small>' + FLAGS[p.country] + ' ' + esc(t('photo.places.' + p.id)) + '</small>'
      })), parseInt(pol.getAttribute('data-index'), 10));
    }
  });

  function step(d) {
    const i = order.indexOf(state.place);
    openPlace(order[(i + d + order.length) % order.length], false, true);
  }

  function openPlace(id, fromPills, keepFocus) {
    const p = byId[id];
    if (!p) return;
    state.place = id;
    state.region = p.region;
    stage.classList.add('has-panel');
    panel.hidden = false;
    renderPanel();
    renderPills();
    labels.querySelectorAll('.gl-place').forEach((el) => el.classList.toggle('is-active', el.getAttribute('data-place') === id));
    backBtn.hidden = state.mode === 'flat';
    if (engine) { engine.resize(); engine.focusPlace(p); }
    const nameEl = panel.querySelector('.pp__name');
    if (keepFocus) {
      const btn = panel.querySelector(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.step === '-1' ? '[data-step="-1"]' : '[data-step="1"]');
      if (btn) btn.focus({ preventScroll: true });
    } else if (nameEl) {
      nameEl.focus({ preventScroll: true });
    }
    if (window.innerWidth < 1024 || fromPills) {
      const top = stage.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: HJ.reduce ? 'auto' : 'smooth' });
    } else {
      panel.scrollTop = 0;
    }
  }

  function closePlace() {
    const id = state.place;
    state.place = null;
    stage.classList.remove('has-panel');
    panel.hidden = true;
    panel.innerHTML = '';
    renderPills();
    labels.querySelectorAll('.gl-place').forEach((el) => el.classList.remove('is-active'));
    if (engine) { engine.resize(); engine.showRegion(state.region); }
    const m = labels.querySelector('[data-place="' + id + '"]');
    const pill = pills.querySelector('[data-place="' + id + '"]');
    (m && !m.classList.contains('is-hidden') ? m : pill || backBtn).focus({ preventScroll: true });
  }

  function goRegion(r, kb) {
    state.region = r;
    backBtn.hidden = false;
    if (engine) engine.showRegion(r);
    if (kb) setTimeout(() => { const f = labels.querySelector('.gl-place:not(.is-hidden)'); if (f) f.focus({ preventScroll: true }); }, 1600);
  }

  backBtn.addEventListener('click', () => {
    if (state.place) { state.place = null; stage.classList.remove('has-panel'); panel.hidden = true; panel.innerHTML = ''; renderPills(); }
    state.region = null;
    backBtn.hidden = true;
    if (engine) { engine.resize(); engine.showGlobe(); }
    const b = labels.querySelector('.gl-bubble');
    if (b) b.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.place && document.getElementById('lightbox').hidden) closePlace();
  });

  /* ---------- Langue ---------- */
  function refreshTexts() {
    renderCounter();
    renderPills();
    buildMarkers();
    if (state.place) {
      renderPanel();
      labels.querySelectorAll('.gl-place').forEach((el) => el.classList.toggle('is-active', el.getAttribute('data-place') === state.place));
    }
    if (engine) engine.refresh();
  }
  document.addEventListener('langchange', refreshTexts);
  renderCounter();
  renderPills();
  buildMarkers();

  /* ---------- Choix du moteur : 3D ou carte plate ---------- */
  function webglOK() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  const ctx = { view, labels, canvas, places, byId, dots, state, declutter, stage, loading, backBtn };

  const near = new Promise((res) => {
    if (!('IntersectionObserver' in window)) return res();
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); res(); } }, { rootMargin: '900px 0px' });
    io.observe(sec);
  });
  await near;

  if (HJ.reduce || !webglOK()) {
    engine = flatMap(ctx);
  } else {
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000));
      const [THREE, { OrbitControls }] = await Promise.race([
        Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]),
        timeout
      ]);
      engine = globe3D(THREE, OrbitControls, ctx);
    } catch (err) {
      console.warn('Globe 3D indisponible, carte plate utilisée.', err);
      engine = flatMap(ctx);
    }
  }
  view.classList.add('globe-ready');
  if (state.place && engine) engine.focusPlace(byId[state.place]);
}

/* =========================================================
   GLOBE 3D
   ========================================================= */
function globe3D(THREE, OrbitControls, ctx) {
  const { view, labels, canvas, places, dots, state, declutter, byId, backBtn } = ctx;
  const mobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x050505, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);

  const vec = (lat, lon, r = 1) => {
    const phi = (90 - lat) * DEG, th = (lon + 180) * DEG;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };

  // Océan sombre
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, mobile ? 48 : 72, mobile ? 48 : 72), new THREE.MeshBasicMaterial({ color: 0x0c0c0c })));

  // Continents en points (« dot matrix »)
  const dotTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const stepN = mobile ? 2 : 1;
  const pos = [];
  for (let i = 0; i < dots.length; i += 2 * stepN) { const v = vec(dots[i], dots[i + 1], 1.002); pos.push(v.x, v.y, v.z); }
  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const landSize = mobile ? 0.019 : 0.013;
  const landMat = new THREE.PointsMaterial({ size: landSize, map: dotTex, transparent: true, opacity: 0.78, color: 0xf1eee7, depthWrite: false, alphaTest: 0.2 });
  scene.add(new THREE.Points(landGeo, landMat));

  // Points plus fins pour la vue rapprochée (Maroc → Alpes), chargés à part
  const fineMat = new THREE.PointsMaterial({ size: 0.0019, map: dotTex, transparent: true, opacity: 0, color: 0xf1eee7, depthWrite: false });
  fetch('data/land-dots-fine.json').then((r) => r.json()).then((fd) => {
    const fp = [];
    for (let i = 0; i < fd.length; i += 2) { const v = vec(fd[i], fd[i + 1], 1.0015); fp.push(v.x, v.y, v.z); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    scene.add(new THREE.Points(g, fineMat));
  }).catch(() => {});

  // Lueur rouge autour du globe
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vN; void main(){ float d = abs(dot(vN, vec3(0.0,0.0,1.0))); float i = smoothstep(0.0, 0.62, d); i = i * i * i; gl_FragColor = vec4(0.88,0.03,0.0,1.0) * i * 1.5; }',
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
    })
  );
  scene.add(glow);

  // Étoiles discrètes
  const sp = [];
  const rnd = HJ.rand(42);
  for (let i = 0; i < (mobile ? 260 : 600); i++) {
    const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(18 + rnd() * 20);
    sp.push(v.x, v.y, v.z);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.09, color: 0x8a8780, transparent: true, opacity: 0.7, map: dotTex, depthWrite: false })));

  // Points rouges des lieux (s'allument un par un)
  const placeMeshes = places.map((p) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.0045 + p.photos.length * 0.0003, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff2a1a }));
    m.position.copy(vec(p.lat, p.lon, 1.003));
    m.scale.setScalar(0.001);
    scene.add(m);
    return m;
  });

  // Arc rouge du parcours : Maroc → Saint-Étienne → Chamonix → Genève
  const arcs = [];
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = byId[ROUTE[i]], b = byId[ROUTE[i + 1]];
    const va = vec(a.lat, a.lon).normalize(), vb = vec(b.lat, b.lon).normalize();
    const ang = va.angleTo(vb);
    const pts = [];
    const N = 64;
    for (let k = 0; k <= N; k++) {
      const s = k / N;
      const v = new THREE.Vector3().copy(va).multiplyScalar(Math.sin((1 - s) * ang) / Math.sin(ang))
        .add(new THREE.Vector3().copy(vb).multiplyScalar(Math.sin(s * ang) / Math.sin(ang)));
      v.normalize().multiplyScalar(1.003 + Math.sin(Math.PI * s) * Math.max(0.012, ang * 0.32));
      pts.push(v);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 80, mobile ? 0.0032 : 0.0022, 6, false);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2414, transparent: true, opacity: 0.95 }));
    geo.setDrawRange(0, 0);
    scene.add(mesh);
    const lgeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160));
    const line = new THREE.Line(lgeo, new THREE.LineBasicMaterial({ color: 0xff2414, transparent: true, opacity: 0.9 }));
    lgeo.setDrawRange(0, 0);
    scene.add(line);
    arcs.push({ geo, total: geo.index.count, mesh, line, lgeo, ltotal: 161 });
  }

  // Contrôles : souris, doigt, molette, pincement
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.7;
  controls.minDistance = 1.08;
  controls.maxDistance = 6.5;
  const fitDist = () => Math.min(6.2, 1.32 / (Math.tan(20 * DEG) * Math.min(1, camera.aspect || 1)));
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.35;
  let userTouched = false;
  controls.addEventListener('start', () => { userTouched = true; controls.autoRotate = false; cancelFly(); });

  camera.position.copy(vec(18, -70, 4.6));
  controls.update();

  /* ---------- Vols de caméra ---------- */
  let fly = null;
  function cancelFly() { fly = null; controls.enabled = true; }
  function flyTo(lat, lon, dist, dur = 1400) {
    return new Promise((res) => {
      const from = camera.position.clone();
      const fromDir = from.clone().normalize();
      const toDir = vec(lat, lon).normalize();
      fly = { t0: performance.now(), dur, fromDir, toDir, d0: from.length(), d1: dist, res };
    });
  }
  function stepFly(now) {
    if (!fly) return;
    const k = Math.min(1, (now - fly.t0) / fly.dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const ang = fly.fromDir.angleTo(fly.toDir);
    let dir;
    if (ang < 1e-4) dir = fly.toDir.clone();
    else {
      dir = fly.fromDir.clone().multiplyScalar(Math.sin((1 - e) * ang) / Math.sin(ang))
        .add(fly.toDir.clone().multiplyScalar(Math.sin(e * ang) / Math.sin(ang))).normalize();
    }
    // petite remontée au milieu du vol pour un effet « plongée »
    const lift = Math.sin(Math.PI * e) * Math.min(0.6, ang * 0.5);
    camera.position.copy(dir.multiplyScalar(fly.d0 + (fly.d1 - fly.d0) * e + lift));
    camera.lookAt(0, 0, 0);
    if (k >= 1) { const r = fly.res; fly = null; controls.update(); r(); }
  }

  /* ---------- Niveaux de zoom ---------- */
  // Distance de la caméra pour que tous les lieux d'une région tiennent à l'écran
  function regionDist(r) {
    const R = REGIONS[r];
    const list = places.filter((p) => p.region === r);
    let dLat = 0, dLon = 0;
    list.forEach((p) => { dLat = Math.max(dLat, Math.abs(p.lat - R.lat)); dLon = Math.max(dLon, Math.abs(p.lon - R.lon) * Math.cos(R.lat * DEG)); });
    const tanH = Math.tan(20 * DEG);
    const needV = (dLat + 0.75) * DEG / tanH;
    const needH = (dLon + 0.9) * DEG / (tanH * (camera.aspect || 1));
    return 1 + Math.max(needV, needH, 0.06);
  }
  let level = 1; // 1 = globe, 2 = région
  function showGlobe() {
    level = 1; state.region = null;
    flyTo(REGIONS.maroc.lat - 2, REGIONS.maroc.lon + 8, fitDist(), 1300).then(() => { if (!userTouched) controls.autoRotate = true; });
  }
  function showRegion(r) {
    if (!r) return showGlobe();
    level = 2; state.region = r;
    controls.autoRotate = false;
    const R = REGIONS[r];
    flyTo(R.lat, R.lon, regionDist(r), 1500).then(() => {
      labels.querySelectorAll('.gl-place').forEach((el, i) => {
        if (byId[el.dataset.place].region === r) { el.classList.remove('is-lit'); void el.offsetWidth; el.querySelector('.gl-place__dot').style.animationDelay = (i * 40) + 'ms'; el.classList.add('is-lit'); }
      });
    });
  }
  function focusPlace(p) {
    level = 2; state.region = p.region;
    controls.autoRotate = false;
    flyTo(p.lat, p.lon, regionDist(p.region) * 0.985, 1200);
  }

  /* ---------- Étiquettes HTML suivant le globe ---------- */
  const markers = () => Array.from(labels.querySelectorAll('.gl'));
  const tmp = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  let W = 1, H = 1;
  function updateLabels() {
    const dist = camera.position.length();
    camDir.copy(camera.position).normalize();
    const showPlaces = level === 2 || dist < 1.55;
    const items = [];
    markers().forEach((el) => {
      let lat, lon, isPlace = el.classList.contains('gl-place');
      if (isPlace) { const p = byId[el.dataset.place]; lat = p.lat; lon = p.lon; }
      else { const R = REGIONS[el.dataset.region]; lat = R.lat; lon = R.lon; }
      const w = vec(lat, lon, 1.003);
      const facing = w.clone().normalize().dot(camDir);
      let visible = facing > 0.2 && (isPlace ? showPlaces : !showPlaces);
      if (isPlace && state.region && level === 2 && byId[el.dataset.place].region !== state.region && dist > 1.3) visible = false;
      el.classList.toggle('is-hidden', !visible);
      if (!visible) return;
      tmp.copy(w).project(camera);
      const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * H;
      el.style.transform = 'translate(' + (x - (isPlace ? 22 : 0)).toFixed(1) + 'px,' + (y - (isPlace ? 22 : 0)).toFixed(1) + 'px)' + (isPlace ? '' : (el.dataset.region === 'maroc' ? (W < 600 ? ' translate(-62%,30%)' : ' translate(-88%,10%)') : (W < 600 ? ' translate(-38%,-130%)' : ' translate(-12%,-110%)')));
      if (isPlace) items.push({ el, x, y, r: parseFloat(el.style.getPropertyValue('--s')) / 2 || 6, n: byId[el.dataset.place].photos.length, W, H });
    });
    if (items.length) declutter(items);
  }
  labels.querySelectorAll('.gl').forEach((el) => { el.style.left = '0'; el.style.top = '0'; });

  /* ---------- Taille + rendu ---------- */
  function resize() {
    W = view.clientWidth; H = view.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / Math.max(1, H);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(view);
  resize();

  // On ne dessine que lorsque le globe est à l'écran (économise la batterie)
  let running = false;
  function loop(now) {
    requestAnimationFrame(loop);
    const r = view.getBoundingClientRect();
    running = r.bottom > -50 && r.top < window.innerHeight + 50 && !document.hidden;
    if (!running) return;
    checkIntro();
    const dist = camera.position.length();
    landMat.size = landSize * Math.min(1, Math.max(0.2, (dist - 1) / 1.6));
    landMat.opacity = 0.78 * Math.min(1, Math.max(0.15, (dist - 1.2) / 0.5));
    fineMat.opacity = Math.min(0.8, Math.max(0, (1.9 - dist) / 0.5));
    const far = dist > 1.6;
    placeMeshes.forEach((m) => { m.visible = far; });
    arcs.forEach((a) => { a.mesh.visible = far; });
    stepFly(now);
    if (!fly) {
      controls.rotateSpeed = 0.15 + Math.min(0.45, (camera.position.length() - 1) * 0.3);
      controls.update();
    }
    animateIntro(now);
    renderer.render(scene, camera);
    updateLabels();
  }

  /* ---------- Animation d'arrivée ---------- */
  let intro = null;
  function animateIntro(now) {
    if (!intro || !intro.t0) return;
    const el = now - intro.t0;
    // Arcs : chacun se dessine en 700 ms
    arcs.forEach((a, i) => {
      const k = Math.min(1, Math.max(0, (el - i * 650) / 700));
      a.geo.setDrawRange(0, Math.floor(k * a.total / 3) * 3);
      a.lgeo.setDrawRange(0, Math.floor(k * a.ltotal));
    });
    // Points des lieux : un par un
    const lightStart = arcs.length * 650 + 200;
    placeMeshes.forEach((m, i) => {
      const k = Math.min(1, Math.max(0, (el - lightStart - i * 110) / 300));
      const s = k < 1 ? 0.001 + k * 1.6 * (1 - k) + k : 1;
      m.scale.setScalar(Math.max(0.001, s));
    });
    if (el > lightStart + placeMeshes.length * 110 + 400) {
      intro = null;
      labels.classList.remove('is-intro');
      if (!userTouched && level === 1) controls.autoRotate = true;
    }
  }
  labels.classList.add('is-intro');
  setTimeout(() => labels.classList.remove('is-intro'), 9000);
  const startIntro = () => {
    if (state.place) { // un lieu a déjà été choisi avec les pastilles
      arcs.forEach((a) => { a.geo.setDrawRange(0, a.total); a.lgeo.setDrawRange(0, a.ltotal); });
      placeMeshes.forEach((m) => m.scale.setScalar(1));
      labels.classList.remove('is-intro');
      return;
    }
    flyTo(REGIONS.maroc.lat, REGIONS.maroc.lon, fitDist(), 2000).then(() => { intro = { t0: performance.now() }; });
  };
  // Lance l'animation d'arrivée quand le globe est bien visible à l'écran
  let introStarted = false;
  function checkIntro() {
    if (introStarted) return;
    const r = view.getBoundingClientRect();
    const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    if (vis > Math.min(r.height, window.innerHeight) * 0.45) { introStarted = true; startIntro(); }
  }

  requestAnimationFrame(loop);

  return {
    resize: () => { resize(); setTimeout(resize, 300); },
    showRegion, showGlobe, focusPlace,
    refresh: () => { labels.querySelectorAll('.gl').forEach((el) => { el.style.left = '0'; el.style.top = '0'; }); }
  };
}

/* =========================================================
   CARTE PLATE DE SECOURS (pas de 3D ou animations réduites)
   ========================================================= */
function flatMap(ctx) {
  const { view, labels, places, dots, byId, declutter, canvas, state, backBtn } = ctx;
  state.mode = 'flat';
  canvas.style.display = 'none';
  view.classList.add('is-flat');
  const box = document.getElementById('flatmap');
  box.hidden = false;
  const BOX = {
    maroc: { L0: -8.7, L1: -3.1, B0: 32.3, B1: 36.4 },
    alpes: { L0: 3.5, L1: 7.7, B0: 44.85, B1: 46.75 }
  };
  Object.values(BOX).forEach((b) => {
    b.k = Math.cos(((b.B0 + b.B1) / 2) * DEG);
    b.VW = (b.L1 - b.L0) * b.k; b.VH = b.B1 - b.B0;
  });
  function svgFor(r, pts) {
    const b = BOX[r];
    const rad = (b.VH / 90).toFixed(3);
    let out = '<svg viewBox="0 0 ' + b.VW.toFixed(3) + ' ' + b.VH.toFixed(3) + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
    for (let i = 0; i < pts.length; i += 2) {
      const la = pts[i], lo = pts[i + 1];
      if (lo >= b.L0 && lo <= b.L1 && la >= b.B0 && la <= b.B1) out += '<circle class="land" cx="' + ((lo - b.L0) * b.k).toFixed(3) + '" cy="' + (b.B1 - la).toFixed(3) + '" r="' + rad + '"/>';
    }
    return out + '</svg>';
  }
  function draw(pts) {
    box.innerHTML = '<div class="fm-grid">' + Object.keys(BOX).map((r) =>
      '<div class="fm" data-r="' + r + '"><p class="fm__lbl">' + I18N.esc(I18N.t('photo.regions.' + r)) + ' ' + REGIONS[r].flags + '</p>' + svgFor(r, pts) + '</div>').join('') +
      '</div><p class="flatmap__note">' + I18N.esc(I18N.t('photo.flat_note')) + '</p>';
    layout();
  }
  draw(dots);
  fetch('data/land-dots-fine.json').then((r) => r.json()).then(draw).catch(() => {});

  function layout() {
    const vr = view.getBoundingClientRect();
    const items = [];
    labels.querySelectorAll('.gl-bubble').forEach((el) => el.classList.add('is-hidden'));
    Object.keys(BOX).forEach((r) => {
      const fm = box.querySelector('.fm[data-r="' + r + '"] svg');
      if (!fm) return;
      const fr = fm.getBoundingClientRect();
      const b = BOX[r];
      const sc = Math.min(fr.width / b.VW, fr.height / b.VH);
      const ox = fr.left - vr.left + (fr.width - b.VW * sc) / 2;
      const oy = fr.top - vr.top + (fr.height - b.VH * sc) / 2;
      places.filter((p) => p.region === r).forEach((p) => {
        const el = labels.querySelector('.gl-place[data-place="' + p.id + '"]');
        if (!el) return;
        el.classList.remove('is-hidden');
        const x = ox + (p.lon - b.L0) * b.k * sc, y = oy + (b.B1 - p.lat) * sc;
        el.style.left = '0'; el.style.top = '0';
        el.style.transform = 'translate(' + (x - 22).toFixed(1) + 'px,' + (y - 22).toFixed(1) + 'px)';
        items.push({ el, x, y, r: 7, n: p.photos.length, W: vr.width, H: vr.height });
      });
    });
    declutter(items);
  }
  new ResizeObserver(() => layout()).observe(view);
  backBtn.hidden = true;
  return {
    resize: () => { layout(); setTimeout(layout, 300); },
    showRegion: () => {}, showGlobe: layout, focusPlace: () => {},
    refresh: () => { draw(dots); fetch('data/land-dots-fine.json').then((r) => r.json()).then(draw).catch(() => {}); }
  };
}
