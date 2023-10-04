// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AdaCAD',
  tagline: 'An Experimental Tool for Experimental Weavers',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.adacad.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'unstabledesignlab', // Usually your GitHub org/user name.
  projectName: 'adacad', // Usually your repo name.

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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
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
            label: 'How To',
          },
          {
            type: 'docSidebar',
            sidebarId: 'devDocsSidebar',
            position: 'left',
            label: 'Developer Documentation',
          },
          {to: '/blog', label: 'Showcase', position: 'left'},
          {
            href: 'https://github.com/UnstableDesign/AdaCAD',
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
                label: 'Showcase',
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
                href: 'https://github.com/UnstableDesign/AdaCAD',
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
