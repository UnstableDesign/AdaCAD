// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AdaCAD',
  tagline: 'AdaCAD is an experimental workspace that applies parametric design to the domain of weave drafting. It supports algorithmic and playful approaches to developing woven structures and cloth, for shaft and jacquard looms.',
  favicon: 'img/favicon.ico',


  // Set the production url of your site here
  url: 'https://docs.adacad.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'unstabledesignlab', // Usually your GitHub org/user name.
  projectName: 'AdaCAD_Documentation', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
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
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/UnstableDesign/AdaCAD_Documentation/tree/main',
        },
        blog: {
          showReadingTime: true,
          editUrl:
          'https://github.com/UnstableDesign/AdaCAD_Documentation/tree/main',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'AdaCAD',
        logo: {
          alt: 'AdaCAD Logo',
          src: 'img/adalogo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'userDocsSidebar',
            position: 'left',
            label: 'Learn',
          },
          {
            type: 'docSidebar',
            sidebarId: 'devDocsSidebar',
            position: 'left',
            label: 'Develop',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/UnstableDesign/AdaCAD_Documentation',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://adacad.org',
            label: 'Use AdaCAD Online',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Site',
            items: [
              {
                label: 'User Documentation',
                to: '/docs/howtouse/getting-started',
              },
              {
                label: 'Developer Documentation',
                to: 'docs/howtodevelop/install',
              },
              {
                label: 'Blog',
                to: '/blog',
              },
            ],
          },
          {
            title: 'Authors',
            items: [
      
              
              {
                label: 'Unstable Design Lab',
                href: 'https://unstable.design/',
              },
              {
                label: 'ATLAS Institute',
                href: 'https://www.colorado.edu/atlas/',
              },
              {
                label: 'University of Colorado Boulder',
                href: 'https://www.colorado.edu/',
              }
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Instagram',
                href: 'https://www.instagram.com/unstabledesignlab/?hl=en',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/UnstableDesign/AdaCAD_Documentation',
              },
              {
                label: 'AdaCAD Forum',
                href: 'https://groups.google.com/g/adacad-forum',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Unstable Design Lab, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
