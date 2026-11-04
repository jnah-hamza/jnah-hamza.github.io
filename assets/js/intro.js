/* =========================================================
   ÉCRAN D'INTRO : initiales « HJ » en 3D (2 secondes max)
   ========================================================= */
const root = document.documentElement;
const intro = document.getElementById('intro');
const MAX = 2000;

if (intro && root.classList.contains('show-intro')) run();

function run() {
  const t0 = performance.now();
  let done = false, raf = 0, renderer = null;

  function finish() {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('hj-intro', '1'); } catch (e) {}
    intro.classList.add('is-done');
    root.classList.add('intro-done');
    setTimeout(() => {
      cancelAnimationFrame(raf);
      if (renderer) { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); }
      intro.remove();
      root.classList.remove('show-intro');
    }, 650);
  }
  intro.querySelector('.intro__skip').addEventListener('click', finish);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(); }, { once: true });
  setTimeout(finish, MAX);

  // On ne charge la 3D que si elle arrive vite (sinon l'intro reste en 2D)
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('lent')), 900));
  Promise.race([import('three'), timeout]).then((THREE) => {
    if (done) return;
    start3D(THREE);
  }).catch(() => {});

  function start3D(THREE) {
    const canvas = document.getElementById('intro-canvas');
    const mobile = window.innerWidth < 768;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, mobile ? 6.2 : 4.6);

    const H = new THREE.Shape();
    [[0, 0], [0.2, 0], [0.2, 0.5], [0.4, 0.5], [0.4, 0], [0.6, 0], [0.6, 1.2], [0.4, 1.2], [0.4, 0.7], [0.2, 0.7], [0.2, 1.2], [0, 1.2]]
      .forEach(([x, y], i) => (i ? H.lineTo(x, y) : H.moveTo(x, y)));
    const J = new THREE.Shape();
    [[0.22, 1.2], [0.62, 1.2], [0.62, 0.18], [0.44, 0], [0.06, 0], [0, 0.06], [0, 0.38], [0.2, 0.38], [0.2, 0.2], [0.42, 0.2], [0.42, 1.0], [0.22, 1.0]]
      .forEach(([x, y], i) => (i ? J.lineTo(x, y) : J.moveTo(x, y)));

    const opts = { depth: 0.26, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 2, curveSegments: 4 };
    const front = new THREE.MeshStandardMaterial({ color: 0xf1eee7, roughness: 0.45, metalness: 0.05 });
    const side = new THREE.MeshStandardMaterial({ color: 0xe10600, roughness: 0.35, metalness: 0.1 });
    const group = new THREE.Group();
    const h = new THREE.Mesh(new THREE.ExtrudeGeometry(H, opts), [front, side]);
    const j = new THREE.Mesh(new THREE.ExtrudeGeometry(J, opts), [front, side]);
    h.position.set(-0.72, -0.6, -0.13);
    j.position.set(0.08, -0.6, -0.13);
    group.add(h, j);
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 4); scene.add(key);
    const rim = new THREE.PointLight(0xff2010, 18, 10); rim.position.set(-2.5, -1, 1.5); scene.add(rim);

    function size() {
      const w = window.innerWidth, hh = window.innerHeight;
      renderer.setSize(w, hh, false);
      camera.aspect = w / hh;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size);

    let mx = 0, my = 0;
    window.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    intro.classList.add('has-3d');
    const loop = (now) => {
      const k = (now - t0) / 1000;
      const e = Math.max(0, 1 - k / 0.9);
      group.rotation.y = -1.3 * e * e + Math.sin(k * 2.4) * 0.22 + mx * 0.35;
      group.rotation.x = Math.sin(k * 1.1) * 0.12 + my * 0.25;
      const s = Math.min(1, 0.6 + k * 0.6);
      group.scale.setScalar(s);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
}
