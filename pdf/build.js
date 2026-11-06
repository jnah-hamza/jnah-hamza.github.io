/* =========================================================
   Portfolio PDF — Hamza Jnah
   Génère pdf/portfolio(-en).html à partir des textes et données du site,
   puis le PDF A4 paysage dans assets/docs/.
   Utilisation (depuis la racine du dépôt) :
     node pdf/build.js fr     → assets/docs/portfolio-hamza-jnah.pdf
     node pdf/build.js en     → assets/docs/portfolio-hamza-jnah-en.pdf
   Dépendances : playwright (Chromium) et qrcode (npm).
   ========================================================= */
const fs = require('fs');
const path = require('path');
const QR = require('qrcode');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const LANG = (process.argv[2] || 'fr').toLowerCase() === 'en' ? 'en' : 'fr';
const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'lang', LANG + '.json'), 'utf8'));
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'site.json'), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'photos.json'), 'utf8'));
const SITE = 'https://jnah-hamza.github.io';

/* Libellés propres au PDF (le reste vient de lang/*.json) */
const L = {
  fr: { pages: 'Portfolio 2027', projects: 'Projets', role: 'Mon rôle', context: 'Contexte', figures: 'Chiffres clés',
    open: 'Voir la présentation (Canva)', pdf911: 'Note de synthèse (PDF)', report: 'Lire le rapport (PDF)',
    scan: 'Scanner pour voir la vidéo', watch: 'Voir sur YouTube', insta: 'Plus de photos sur Instagram', interactive: 'Découvrez la version interactive',
    site: 'Le site', tools: 'Outils', langs: 'Langues', proto: 'Tester le prototype', plan: 'Voir notre plan d\'action',
    selection: 'Sélection', extra: 'Parascolaire', mobility: 'Mobilité', licence: 'Permis B', email: 'E-mail', phone: 'Téléphone' },
  en: { pages: 'Portfolio 2027', projects: 'Projects', role: 'My role', context: 'Context', figures: 'Key figures',
    open: 'View the presentation (Canva)', pdf911: 'Summary report (PDF)', report: 'Read the report (PDF)',
    scan: 'Scan to watch the video', watch: 'Watch on YouTube', insta: 'More photos on Instagram', interactive: 'Discover the interactive version',
    site: 'Website', tools: 'Tools', langs: 'Languages', proto: 'Try the prototype', plan: 'See our action plan',
    selection: 'Selection', extra: 'Activities', mobility: 'Mobility', licence: 'Driving licence B', email: 'Email', phone: 'Phone' }
}[LANG];

/* ---------- Aides ---------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (s) => String(s == null ? '' : s).replace(/\s*\[À COMPLÉTER[^\]]*\]/g, '').trim();
const h = (s) => esc(strip(s)).replace(/==([^=]+?)==/g, '<mark>$1</mark>');
const has = (s) => !!strip(s).replace(/==/g, '');
const img = (rel) => '../' + rel;
const thumb = (folder, file) => img('assets/img/' + folder + '/thumbs/' + file + '.webp');
const cap = (file) => T.extra.captions[file] || '';
const abs = (rel) => SITE + '/' + rel;
const logo = (src, alt, cls) => src ? '<span class="lg ' + (cls || '') + '"><img src="' + img(src) + '" alt="' + esc(alt) + '"></span>' : '';
const link = (url, label, cls) => '<a class="lnk ' + (cls || '') + '" href="' + esc(url) + '">' + esc(label) + ' ↗</a>';
const pola = (src, caption, tilt, cls) => '<figure class="pola ' + (cls || '') + '" style="--t:' + (tilt || 0) + 'deg"><img src="' + src + '" alt=""><figcaption>' + esc(caption || '') + '</figcaption></figure>';
async function qr(url, size) {
  const svg = await QR.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#0000' } });
  return '<a class="qr" href="' + esc(url) + '" style="width:' + size + 'mm;height:' + size + 'mm">' + svg + '</a>';
}

let N = 0; const TOTAL = 15;
function page(cls, inner, title) {
  N++;
  return '<section class="page ' + cls + '">' +
    (title ? '<header class="ph"><span class="ph__kick">✦✦✦ ' + esc(L.pages) + '</span><h2 class="ph__title">' + esc(title) + '</h2></header>' : '') +
    inner +
    '<footer class="pf"><span>Hamza Jnah</span><span>' + String(N).padStart(2, '0') + ' / ' + TOTAL + '</span></footer></section>';
}

(async () => {
  const pages = [];
  const it = T.projects.items;
  const clubs = Object.fromEntries(S.clubs.map((c) => [c.id, c]));
  const C = T.extra.clubs;

  /* 1. Couverture */
  pages.push(page('cover paper', `
    <div class="cover__left">
      <p class="kick">45.4397° N, 4.3872° E · ${esc(L.pages)}</p>
      <h1 class="cover__name"><span>HAMZA</span><span class="red">JNAH</span></h1>
      <p class="cover__sub">${h(T.hero.subtitle)}</p>
      <p class="double">${logo('assets/img/logos/logo-encg-settat.webp', 'ENCG Settat', 'lg--s')}<b>×</b>${logo('assets/img/logos/logo-iae-saint-etienne.webp', 'IAE Saint-Étienne', 'lg--s')}<span>${h(T.hero.double)}</span></p>
      <div class="seek"><strong>${h(T.hero.badge_kicker)}</strong><span>${h(T.hero.badge_text)}</span></div>
      <p class="cover__pitch">${h(T.hero.pitch)}</p>
    </div>
    <div class="cover__right"><div class="band"></div><img class="cutout" src="${img('assets/img/portrait.webp')}" alt=""></div>
    <div class="torn torn--b"></div>`));

  /* 2. Hello */
  const ab = T.about;
  pages.push(page('paper hello', `
    <div class="hello__photo"><div class="film"><span class="film__code">HJ 2027 · 400</span><img src="${img('assets/img/portrait-hello.webp')}" alt=""><span class="film__num">24 ▸ 24A</span></div></div>
    <div class="hello__txt">
      <p class="kick">✦ ${esc(ab.title)}</p>
      <h2 class="sig">${esc(ab.lead)}</h2>
      <p class="lead">${h(ab.text)}</p>
      <p class="double double--dark">${logo('assets/img/logos/logo-encg-settat.webp', 'ENCG', 'lg--s')}<b>×</b>${logo('assets/img/logos/logo-iae-saint-etienne.webp', 'IAE', 'lg--s')}<span>${h(T.hero.double)}</span></p>
      <h3 class="lbl">${esc(ab.strengths_title)}</h3>
      <ul class="brings">${ab.cards.map((c, i) => `<li class="${i === 0 ? 'is-red' : ''}"><strong>${esc(c.title)}</strong><span>${esc(c.text)}</span></li>`).join('')}</ul>
      <div class="mob"><span class="mob__lbl">${esc(L.mobility)}</span><span class="mob__line">Saint-Étienne <i></i> Lyon</span><span class="licence"><b>B</b>${esc(L.licence)}</span></div>
    </div>`, null));

  /* 3. Formation */
  const ed = T.experience.education;
  pages.push(page('paper edu', `
    <div class="edu__double"><span class="edu__dlbl">${esc(T.experience.double)}</span>${logo(S.double_degree[0][0], 'ENCG', 'lg--xl')}<b>×</b>${logo(S.double_degree[1][0], 'IAE', 'lg--xl')}<span class="edu__names">ENCG Settat × IAE Saint-Étienne</span></div>
    <ol class="edu__line">${ed.map((e, i) => `<li>${logo(S.education[i].logo, S.education[i].logo_alt, 'lg--xl')}<div class="edu__card"><p class="date">${esc(e.date)}</p><h3>${esc(e.degree)}</h3><p class="school">${esc(e.school)}</p>${e.note ? `<p class="note">${esc(e.note)}</p>` : ''}</div></li>`).join('')}</ol>`,
    T.experience.edu_title));

  /* 4. Expériences */
  pages.push(page('paper exp', `<div class="exp__grid">${T.experience.items.map((e, i) => `
    <article class="card">${logo(S.experience[i].logo, S.experience[i].logo_alt, 'lg--xxl')}
      <p class="date">${esc(e.date)}</p><h3>${esc(e.role)}</h3><p class="org"><b>${esc(e.org)}</b> · ${esc(e.place)}</p>
      <ul class="pts">${e.points.map((p) => `<li>${h(p)}</li>`).join('')}</ul>
      <p class="chips">${(e.tags || []).map((x) => `<span>${esc(x)}</span>`).join('')}</p></article>`).join('')}</div>`, T.experience.title));

  /* 5. Porsche × Hermès */
  const ph = it['porsche-hermes'], pp = S.projects.find((p) => p.id === 'porsche-hermes');
  pages.push(page('black proj911', `
    <div class="p911__hero" style="background-image:url('${img(pp.cover)}')"><div class="p911__in">
      <p class="kick kick--light">${esc(ph.kind)} · ${esc(ph.year)}</p>
      <h2 class="p911__title">${esc(ph.title)}</h2><p class="p911__tag">${esc(ph.tagline)}</p>
      <p class="chips chips--light">${ph.chips.map((x) => `<span>${esc(x)}</span>`).join('')}</p></div>
      <span class="p911__note">${esc(T.projects.labels.concept_visual)}</span></div>
    <div class="p911__body">
      <div class="p911__col">
        <h3 class="lbl lbl--light">${esc(L.context)}</h3><p>${h(ph.context)}</p>
        <h3 class="lbl lbl--light">${esc(T.projects.labels.concept)}</h3><p>${h(ph.concept)}</p>
        <h3 class="lbl lbl--light">${esc(L.role)}</h3><p>${h(ph.role)}</p>
      </div>
      <div class="p911__col">
        <div class="figs">${ph.figures.map((f) => `<div><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></div>`).join('')}</div>
        <div class="pages4">${pp.pages.map((src) => `<img src="${img(src)}" alt="">`).join('')}</div>
        <p class="links">${link(abs(pp.pdf), L.pdf911, 'lnk--red')} ${link(pp.canva, L.open)}</p>
      </div></div>`, null));

  /* 6. Sephora — style journal */
  const se = it.sephora, sp = S.projects.find((p) => p.id === 'sephora');
  pages.push(page('np', `
    <header class="np__mast"><p class="np__ed"><span>Special Edition</span><span>${esc(se.year)}</span><span>ENCG Settat</span></p>
      <p class="np__name">${esc(se.masthead)}</p><h2 class="np__head">${esc(se.title)}</h2><p class="np__deck">${esc(se.tagline)}</p></header>
    <div class="np__figs">${se.figures.map((f) => `<div><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></div>`).join('')}</div>
    <div class="np__cols">
      <div class="np__c"><h3>${esc(L.context)}</h3><p class="drop">${h(se.context)}</p>
        <h3>${esc(T.projects.labels.question)}</h3><blockquote>${h(se.question)}</blockquote>
        <h3>${esc(T.projects.labels.verdict)}</h3><p>${h(se.verdict)}</p></div>
      <div class="np__c"><h3>${esc(T.projects.labels.strategy)}</h3><p>${h(se.strategy)}</p>
        <ol class="np__axes">${se.axes.map((a, i) => `<li><b>0${i + 1}</b><span><strong>${esc(a.t)}</strong> ${esc(a.d)}</span></li>`).join('')}</ol>
        <p class="np__msg">${esc(se.message)}</p><p class="np__plan">${esc(se.plan)}</p></div>
      <div class="np__c np__c--img"><div class="np__cover"><img src="${img(sp.cover)}" alt=""><span class="stamp">${esc(se.stamp)}</span></div>
        <h3>${esc(T.projects.labels.creative)}</h3>${se.creative.map((c) => `<p><strong>${esc(c.t)}</strong> — ${esc(c.d)}</p>`).join('')}
        ${has(se.role) ? `<p><strong>${esc(L.role)} :</strong> ${h(se.role)}</p>` : ''}
        <p class="links">${link(abs(sp.pdf), L.report, 'lnk--red')} ${link(sp.canva, L.open, 'lnk--ink')}</p></div>
    </div>`, null));

  /* 7. Aballa */
  const aa = it.aballa, ap = S.projects.find((p) => p.id === 'aballa');
  pages.push(page('black aballa', `
    <div class="ab__txt"><p class="kick kick--light">${esc(T.projects.categories[ap.category])} · ${esc(aa.kind)}</p>
      <h2 class="ab__title">ABALLA</h2><p class="ab__lead">${h(aa.tagline)}</p>
      <div class="figs figs--2">${aa.figures.map((f) => `<div><strong>${esc(f.value)}</strong><span>${esc(f.label)}</span></div>`).join('')}</div>
      <p class="chips chips--light">${(aa.tiles || []).map((x) => `<span>${esc(x)}</span>`).join('')}</p></div>
    <div class="ab__look">${ap.gallery.map((src) => `<img src="${img(src.replace('/projets/', '/projets/thumbs/'))}" alt="">`).join('')}</div>`, null));

  /* 8. Jobs étudiants */
  pages.push(page('black jobs', `
    <p class="jobs__intro">${h(T.jobs.intro)}</p>
    <p class="chips chips--light chips--big">${T.jobs.skills.map((x, i) => `<span>0${i + 1} · ${esc(x)}</span>`).join('')}</p>
    <div class="jobs__grid">${T.jobs.items.map((j, i) => `<article class="job">${logo(S.jobs[i].logo, S.jobs[i].logo_alt, 'lg--xl')}
      <p class="date date--hand">${esc(j.date)}</p><h3>${esc(j.role)}</h3>${j.org ? `<p class="org">${esc(j.org)}</p>` : ''}${j.desc ? `<p>${h(j.desc)}</p>` : ''}</article>`).join('')}</div>`, T.jobs.title));

  /* 9. Parascolaire : Epik Leaders + Club Génie */
  const ep = clubs.epik, ge = clubs.genie;
  pages.push(page('paper clubs', `
    <div class="club-logos">${S.club_logos.map((l) => `<span>${logo(l.logo, l.name, 'lg--m')}<i>${esc(l.name)}</i></span>`).join('')}</div>
    <div class="two">
      <article class="club club--epik">${logo(ep.logo, ep.logo_alt, 'lg--l')}<div class="club__h"><p class="theme">${esc(C.epik.theme)}</p><h3>${esc(C.epik.name)}</h3><p class="meta">${esc(C.epik.org)}</p></div>
        <div class="steps">${C.epik.steps.map((s, i) => `<div class="step">${ep.steps_photos[i] ? `<img src="${thumb(ep.steps_photos[i].folder, ep.steps_photos[i].file)}" alt="">` : ''}<p class="n">0${i + 1}${s.date ? ' · ' + esc(s.date) : ''}</p><h4>${esc(s.title)}</h4>${has(s.text) ? `<p>${h(s.text)}</p>` : ''}</div>`).join('')}</div></article>
      <article class="club club--genie">${logo(ge.logo, ge.logo_alt, 'lg--l')}<div class="club__h"><p class="theme">${esc(C.genie.theme)}</p><h3>${esc(C.genie.name)}</h3><p class="meta">${esc(C.genie.org)} · ${esc(C.genie.date)}</p></div>
        ${C.genie.roles.map((r) => `<div class="role"><h4>${esc(r.title)}</h4><p>${h(r.text)}</p></div>`).join('')}
        <div class="strip">${ge.photos.slice(0, 3).map((p, i) => pola(thumb(p.folder, p.file), cap(p.file), [-3, 2, -1][i])).join('')}</div></article>
    </div>`, L.extra));

  /* 10. Take & Taste + Rebirth */
  const tt = T.extra.tt, rb = ge.rebirth;
  pages.push(page('paper tt', `
    <div class="two two--tt">
      <article class="club club--genie">
        <p class="theme">${esc(tt.label)} · ${esc(tt.date)}</p><h3 class="big">${esc(tt.title)}</h3>
        <p class="award">★ ${esc(tt.badge)}</p><p>${h(tt.text)}</p><p><strong>${h(tt.role)}</strong></p>
        <div class="strip">${ge.take_taste.photos.map((p, i) => pola(thumb(p.folder, p.file), cap(p.file), [-2, 3][i], 'pola--land')).join('')}</div>
        <p class="links">${link(ge.take_taste.prototype, L.proto, 'lnk--red')}</p></article>
      <article class="lux"><p class="lux__proud">✦ ${esc(T.extra.rebirth.proud)} ✦</p>
        <div class="lux__in"><img class="lux__poster" src="${img(rb.poster_thumb)}" alt="">
        <div><p class="lux__lbl">${esc(T.extra.rebirth.label)}</p><h3 class="lux__title">Rebirth</h3><p>${h(T.extra.rebirth.text)}</p>
        <img class="lux__team" src="${img(rb.team_thumb)}" alt=""><p class="links">${link(rb.plan, L.plan, 'lnk--gold')}</p></div></div></article>
    </div>`, null));

  /* 11. AIESEC + Green Invest + ACCEDE */
  const ai = clubs.aiesec, gr = clubs.green, ac = clubs.accede;
  pages.push(page('paper clubs3', `
    <div class="three">
      <article class="club club--aiesec">${logo(ai.logo, ai.logo_alt, 'lg--l lg--wide')}<div class="club__h"><p class="theme">${esc(C.aiesec.theme)}</p><h3>${esc(C.aiesec.name)}</h3><p class="meta">${esc(C.aiesec.date)}</p></div>
        ${C.aiesec.roles.map((r) => `<div class="role"><h4>${esc(r.title)}</h4><p>${h(r.text)}</p></div>`).join('')}
        <div class="grid3">${ai.photos.slice(0, 3).map((p) => `<img src="${thumb(p.folder, p.file)}" alt="">`).join('')}</div></article>
      <div class="stack">
        <article class="club club--green">${logo(gr.logo, gr.logo_alt, 'lg--l')}<div class="club__h"><p class="theme">${esc(C.green.theme)}</p><h3>${esc(C.green.name)}</h3><p class="meta">${esc(C.green.org)} · ${esc(C.green.date)}</p></div>
          ${C.green.roles.map((r) => `<div class="role"><h4>${esc(r.title)}</h4><p>${h(r.text)}</p></div>`).join('')}
          <div class="grid3">${gr.photos.slice(0, 3).map((p) => `<img src="${thumb(p.folder, p.file)}" alt="">`).join('')}</div></article>
        <article class="club club--accede">${logo(ac.logo, ac.logo_alt, 'lg--l')}<div class="club__h"><p class="theme">${esc(C.accede.theme)}</p><h3>${esc(C.accede.name)}</h3><p class="meta">${esc(C.accede.org)} · ${esc(C.accede.date)}</p></div>
          ${C.accede.roles.map((r) => `<div class="role"><h4>${esc(r.title)}</h4><p>${h(r.text)}</p></div>`).join('')}
          <div class="row"><div class="stats">${C.accede.stats.map((s) => `<span><b>${esc(s.v)}</b>${esc(s.l)}</span>`).join('')}</div><div class="grid2">${ac.photos.slice(0, 2).map((p) => `<img src="${thumb(p.folder, p.file)}" alt="">`).join('')}</div></div></article>
      </div>
    </div>`, null));

  /* 12. Compétences, outils, langues */
  const groups = ['analysis', 'creation', 'creativity', 'communication'];
  pages.push(page('paper skills', `
    <div class="sk__groups">${T.skills.groups.map((g, i) => `<div class="sg ${i === 0 ? 'sg--red' : ''}"><h3>${esc(g.name)}</h3>${i === 0 ? `<p class="hook">${esc(T.skills.box_hook)}</p>` : ''}<p class="chips">${g.items.map((x) => `<span>${esc(x)}</span>`).join('')}</p></div>`).join('')}</div>
    <div class="sk__row">
      <div class="sk__tools"><h3 class="lbl">${esc(L.tools)}</h3><div class="tg">${groups.map((g) => `<div><p class="tg__n">${esc(T.skills.tool_groups[g])}</p><div class="tg__l">${S.tools.filter((x) => x.group === g).map((x) => `<span class="tool">${x.svg ? `<i>${x.svg}</i>` : ''}<b>${esc(LANG === 'en' && x.name_en ? x.name_en : x.name)}</b></span>`).join('')}</div></div>`).join('')}</div></div>
      <div class="sk__langs"><h3 class="lbl">${esc(L.langs)}</h3>${T.skills.lang_story.map((l, i) => `<div class="lang lang--${i}"><p><b>${esc(l.name)}</b> <span>${esc(l.level)}</span></p><p class="hand">${esc(l.text)}</p></div>`).join('')}</div>
    </div>`, T.skills.title));

  /* 13. Vidéographie */
  const vids = [];
  for (const [i, v] of S.videos.entries()) {
    const vi = T.video.items[i]; const url = 'https://youtu.be/' + v.youtube;
    vids.push(`<article class="vid"><a class="vid__screen" href="${url}"><span class="rec">● REC</span>${v.badge ? `<span class="ba">${esc(T.video[v.badge])}</span>` : ''}<span class="play">▶</span><span class="vid__n">0${i + 1}</span></a>
      <h3>${esc(vi.title)}</h3><p class="hand">${esc(vi.poem)}</p><p class="credit">${esc(T.video[v.credit])}</p>
      <div class="vid__qr">${await qr(url, 26)}<span>${esc(L.scan)}<br>${link(url, L.watch)}</span></div></article>`);
  }
  pages.push(page('black video', `<p class="video__intro">${h(T.video.intro)}</p><div class="vids">${vids.join('')}</div>`, T.video.title));

  /* 14. Photographie : 9 photos */
  const pick = ['photo-44-saint-etienne-tram', 'photo-62-chamonix-lac-reflet-dore', 'photo-50-geneve-jet-d-eau', 'photo-02-casablanca-mosquee-hassan2-nuit',
    'photo-35-chefchaouen-minaret-bleu', 'photo-24-al-wahda-voie-lactee', 'photo-41-tanger-chat-endormi', 'photo-23-akchour-riviere-lauriers', 'photo-75-settat-arche-cypres'];
  const placeOf = {};
  P.places.forEach((pl) => pl.photos.forEach((x) => { placeOf[x.file] = pl; }));
  const tilts = [-3, 2, -2, 3, -1, 2, -3, 1, -2];
  pages.push(page('paper photo', `
    <div class="ph__grid">${pick.map((f, i) => { const pl = placeOf[f]; return pola(img('assets/img/photos/thumbs/' + f + '.webp'), T.photo.places[pl.id] + ' · ' + T.photo.countries[pl.country], tilts[i], 'pola--land'); }).join('')}</div>
    <aside class="ph__side"><p class="hand big">${esc(T.photo.globe_title)}</p><p>${esc(T.photo.counter.replace('{photos}', '74').replace('{places}', '13').replace('{countries}', '3'))}</p>
      ${await qr(S.instagram, 38)}<p><b>@the_white_side_</b><br>${link(S.instagram, L.insta)}</p></aside>`, T.photo.title));

  /* 15. Contact */
  pages.push(page('black contact', `
    <div class="ct__l"><h2 class="ct__title">${esc(T.contact.title)}</h2><p class="ct__intro">${esc(T.contact.intro)}</p>
      <ul class="ct__list">
        <li><span>${esc(L.email)}</span><a href="mailto:${S.email}">${S.email}</a></li>
        <li><span>${esc(L.phone)}</span><a href="tel:${S.phone.replace(/\s/g, '')}">${S.phone}</a></li>
        <li><span>LinkedIn</span><a href="${S.linkedin}">linkedin.com/in/hamza-jnah</a></li>
        <li><span>Instagram</span><a href="${S.instagram}">@the_white_side_</a></li>
        <li><span>${esc(L.site)}</span><a href="${SITE}">jnah-hamza.github.io</a></li></ul></div>
    <div class="ct__r"><div class="ct__qr">${await qr(SITE, 70)}</div><p class="ct__cta">${esc(L.interactive)}</p><a class="ct__url" href="${SITE}">jnah-hamza.github.io</a></div>`, null));

  const html = `<!doctype html><html lang="${LANG}"><head><meta charset="utf-8"><title>Portfolio — Hamza Jnah</title>
<meta name="robots" content="noindex">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@500;700&family=Inter+Tight:wght@400;500;600;800&family=Playfair+Display:ital,wght@0,700;0,900;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="portfolio.css"></head><body>${pages.join('\n')}</body></html>`;
  const out = path.join(__dirname, LANG === 'fr' ? 'portfolio.html' : 'portfolio-en.html');
  fs.writeFileSync(out, html);
  // Version compressée pour le PDF : chaque image WebP est convertie en JPEG (PNG si transparente)
  const cache = path.join(__dirname, '.cache');
  fs.mkdirSync(cache, { recursive: true });
  const srcs = [...new Set([...html.matchAll(/(?:src="|url\(')\.\.\/(assets\/[^"')]+\.webp)/g)].map((m) => m[1]))];
  fs.writeFileSync(path.join(cache, 'list.json'), JSON.stringify(srcs));
  require('child_process').execFileSync('python3', [path.join(__dirname, 'compress.py'), ROOT, cache], { stdio: 'inherit' });
  const map = JSON.parse(fs.readFileSync(path.join(cache, 'map.json'), 'utf8'));
  let printHtml = html;
  for (const [from, to] of Object.entries(map)) printHtml = printHtml.split('../' + from).join('.cache/' + to);
  const printOut = path.join(__dirname, '.cache', 'print-' + LANG + '.html');
  fs.writeFileSync(printOut, printHtml.replace('href="portfolio.css"', 'href="../portfolio.css"').split('src=".cache/').join('src="').split("url('.cache/").join("url('"));

  const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const pg = await ctx.newPage();
  await pg.goto('file://' + printOut, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(800);
  const pdf = path.join(ROOT, 'assets', 'docs', LANG === 'fr' ? 'portfolio-hamza-jnah.pdf' : 'portfolio-hamza-jnah-en.pdf');
  await pg.pdf({ path: pdf, format: 'A4', landscape: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
  await browser.close();
  console.log('OK', pdf, N, 'pages');
})();
