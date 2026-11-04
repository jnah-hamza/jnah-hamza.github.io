/* =========================================================
   Page détail d'un projet : projet.html?id=porsche-hermes
   (le contenu est construit par project-view.js)
   ========================================================= */
(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('id') || '';
  var root = document.getElementById('detail');
  var SITE, P;

  function render() {
    if (!P) {
      root.innerHTML = '<section class="nf paper"><div><p class="nf__code">404</p><h1 class="nf__title">' + I18N.html(I18N.t('notfound.title')) + '</h1><p>' + I18N.html(I18N.t('notfound.text')) + '</p><a class="btn btn--red" href="index.html#projets">' + I18N.html(I18N.t('notfound.cta')) + '</a></div></section>';
      return;
    }
    document.title = I18N.clean(I18N.t('projects.items.' + P.id + '.title')) + ' — Hamza Jnah';
    root.innerHTML = HJ.projectHTML(P, SITE.projects, 'index.html#projets');
    HJ.bindProject(root);
  }

  HJ.site.then(function (site) {
    SITE = site;
    P = SITE.projects.filter(function (p) { return p.id === id; })[0];
    HJ.boot(function () { render(); I18N.onChange(render); });
  });
})();
