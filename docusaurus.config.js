module.exports = {
    title: 'APRIL ACI Documentation',  // Titre du site
    url: 'http://localhost',           // URL du site (en dev on peut mettre localhost)
    baseUrl: '/',                      // Chemin de base (racine du site)
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'april-canada-dev',  // Organisation GitHub (optionnel, pour editUrl)
    projectName: 'Documentation',         // Nom du projet (optionnel)
    i18n: {
      defaultLocale: 'fr',    // Langue par défaut (pas de configuration multilingue additionnelle)
      locales: ['fr'],        // On ne déclare qu'une locale (pas de traduction)
    },
    presets: [
      [
        '@docusaurus/preset-classic',
        {
          docs: {
            path: 'docs',                        // Chemin vers les docs (dossier docs/)
            sidebarPath: require.resolve('./sidebars.js'),
            routeBasePath: '/',                 // Sert la documentation à la racine du site&#8203;:contentReference[oaicite:3]{index=3}
            showLastUpdateAuthor: true,
            showLastUpdateTime: true,
          },
          blog: false,                          // Désactive le blog&#8203;:contentReference[oaicite:4]{index=4}
          theme: {
            customCss: require.resolve('./src/css/custom.css'),
          },
        },
      ],
    ],
  };
  