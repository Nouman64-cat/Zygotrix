// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Zygotrix Documentation',
  tagline: 'AI-Powered Genetics Education Platform',
  favicon: 'https://zygotrix.fra1.cdn.digitaloceanspaces.com/cdn/zygotrix-logo.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.zygotrix.com',
  baseUrl: '/',

  organizationName: 'Nouman64-cat',
  projectName: 'Zygotrix',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/Nouman64-cat/Zygotrix/tree/main/zygotrix_docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/Nouman64-cat/Zygotrix/tree/main/zygotrix_docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/zygotrix-social-card.jpg',
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Zygotrix',
        logo: {
          alt: 'Zygotrix Logo',
          src: 'https://zygotrix.fra1.cdn.digitaloceanspaces.com/cdn/zygotrix-logo.png',
          width: 32,
          height: 32,
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'left',
            label: 'API Reference',
          },
          {to: '/founder', label: 'Founder', position: 'left'},
          {
            href: 'https://github.com/Nouman64-cat/Zygotrix',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started/installation',
              },
              {
                label: 'Architecture',
                to: '/docs/architecture/overview',
              },
              {
                label: 'API Reference',
                to: '/docs/api/introduction',
              },
            ],
          },
          {
            title: 'Features',
            items: [
              {
                label: 'AI Chatbot (Zigi)',
                to: '/docs/features/ai-chatbot',
              },
              {
                label: 'GWAS Analysis',
                to: '/docs/features/gwas-analysis',
              },
              {
                label: 'Punnett Squares',
                to: '/docs/features/punnett-squares',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Founder',
                to: '/founder',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/Nouman64-cat/Zygotrix',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Zygotrix. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['python', 'bash', 'json', 'cpp'],
      },
      algolia: undefined, // Can add Algolia search later
    }),
};

export default config;
