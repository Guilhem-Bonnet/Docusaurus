// docusaurus.config.js
/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'Docusaurus Documentation',
  url: 'http://localhost',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'april-canada-dev',
  projectName: 'Documentation',
  i18n: { defaultLocale: 'fr', locales: ['fr'] },
  trailingSlash: false,
  
  themes: ['@docusaurus/theme-mermaid'],

  markdown: { mermaid: true },

  themeConfig: {
    image: 'img/og-image.png', // OG image (crée-le dans static/img)
    metadata: [
      { name: 'keywords', content: 'Docusaurus Documentation, Docs, Architecture, DevOps' },
    ],
    mermaid: {
      theme: { light: 'neutral', dark: 'forest' },
      options: { maxTextSize: 100000 },
    },
    prism: {
      additionalLanguages: ['powershell','csharp','bash','docker','yaml'],
      // darkTheme/lightTheme possibles, si besoin
    },
    navbar: {
      title: 'Docusaurus',
      logo: { alt: 'Docusaurus', src: 'img/logo.svg' },
      items: [
  { to: '/', label: 'Documentation', position: 'left' },
        { type: 'docsVersionDropdown', position: 'right' }, // menu des versions
        // { href: 'https://...', label: 'Repo', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        { title: 'Docs', items: [{ label: 'Accueil', to: '/' }] },
      ],
      copyright: `© ${new Date().getFullYear()} Docusaurus`,
    },
    mermaid: {
      // thème par mode
      theme: { light: 'neutral', dark: 'dark' },
      // options Mermaid passées à mermaid.initialize()
      options: {
        // valeurs safe qui améliorent la lisibilité
        themeVariables: {
          fontSize: '16px',
          fontFamily: 'ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial',
          // (évite de fixer "background" ici : ce serait global aux 2 modes)
          // tu peux aussi ajuster lineColor / primaryTextColor si besoin
        },
      },
    },
    zoom: {
      // ...

      // The toolbar configuration (optional)
      toolbar: {
        // Whether to enable and show a control toolbar with buttons for zoom in, zoom out, and reset
        // Default: false
        enabled: true,

        // The position of the toolbar (top-right, top-left, bottom-right, bottom-left)
        // Default: 'top-right'
        position: 'top-right',

        // The toolbar opacity when the container is not hovered (value between 0 and 1)
        // Default: 0
        opacity: 0,
      },
    },
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Désactivés : nous affichons les infos via le plugin git-lastupdate
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
          editUrl: undefined, // ou ton Git
          // versioning (optionnel)
          lastVersion: 'current',
          versions: { current: { label: 'Latest' } },
        },
        // dans presets -> '@docusaurus/preset-classic'
        blog: {
          path: 'blog',
          routeBasePath: '/blog',
          blogTitle: 'Actualités',
          blogDescription: 'Changelog, annonces et notes techniques',
          postsPerPage: 10,
          showReadingTime: true,
          readingTime: ({content, defaultReadingTime}) =>
            defaultReadingTime({content, options: {wordsPerMinute: 220}}), // FR/CAN ~220 wpm
          blogSidebarTitle: 'Articles récents',
          blogSidebarCount: 10, // ou 'ALL'
          tagsBasePath: 'blog/tags',
          archiveBasePath: 'blog/archive',
          authorsMapPath: 'authors.yml',
          editUrl: 'https://github.com/Guilhem-Bonnet/Documentations',
          include: ['**/*.{md,mdx}'],
          exclude: ['**/_*.{md,mdx}'],
          feedOptions: {
            type: 'all', // 'rss' | 'atom' | 'all' | []
            title: 'Blog',
            description: 'Actualités et notes techniques',
            language: 'fr-CA',
            copyright: `© ${new Date().getFullYear()} Guilhem Bonnet`,
          },
          // Exemples de plugins markdown :
          // remarkPlugins: [require('remark-math')],
          // rehypePlugins: [require('rehype-katex')],
        },
 
        theme: { customCss: require.resolve('./src/css/custom.css') },
        sitemap: { changefreq: 'weekly', priority: 0.5 }
        // gtag: { trackingID: process.env.GTAG_ID || '', anonymizeIP: true },
      },
    ],
  ],

  plugins: [
    // génère @generated/git-lastupdate/lastUpdates.json avec { "<relPathSansExt>": { author, timestamp } }
    [require.resolve('./plugins/git-lastupdate'), {}],
    ['docusaurus-plugin-drawio', {}],
    ['@r74tech/docusaurus-plugin-panzoom', {
    // 👉 attends que Mermaid finisse de rendre
    timeout: 1500, // ↑ augmente si diagrammes lourds / onglets, etc.
    // 👉 cible explicitement les SVG Mermaid
    selectors: [
      'div.docusaurus-mermaid-container',
      'div.mermaid[data-processed="true"]',
      '.mermaid > svg',
      'svg[id^="mermaid-"]'
    ],
    // options passées à @panzoom/panzoom
    zoomOnWheel: true,
    maxScale: 8,
    minScale: 0.5,
    contain: 'outside'
  }],
    // Recherche locale (offline)
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      { hashed: true, language: ["fr"] }
    ],
    // PWA (offline + manifest)
    [
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          { tagName: 'link', rel: 'icon', href: '/img/favicon.ico' },
          { tagName: 'link', rel: 'manifest', href: '/manifest.json' },
          { tagName: 'meta', name: 'theme-color', content: '#0ea5e9' },
        ],
      },
    ],
    // Maths si besoin :
    // ['@docusaurus/plugin-content-docs', { remarkPlugins:[require('remark-math')], rehypePlugins:[require('rehype-katex')] }],
    // Redirects propres
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          // { to: '/', from: ['/home', '/index'] },
        ],
      },
    ],
  ],
};
