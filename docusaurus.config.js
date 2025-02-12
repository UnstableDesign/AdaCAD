// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AdaCAD',
  tagline: 'an algorithmic and playful approach to drafting',
  favicon: 'img/favicon.ico',


  // Set the production url of your site here
  url: 'https://docs.adacad.org',
  baseUrl: '/',

  organizationName: 'unstabledesignlab', // Usually your GitHub org/user name.
  projectName: 'AdaCAD_Documentation', // Usually your repo name.
  //trailingSlash: false,

  onBrokenLinks: 'warn', //throw
  onBrokenMarkdownLinks: 'warn',

//   onBrokenLinks: 'warn',
//  onBrokenMarkdownLinks: 'ignore',

  
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
      image: 'img/adacad-social-card.png',
      navbar: {
        title: 'AdaCAD',
        logo: {
          alt: 'AdaCAD Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'aboutSidebar',
            position: 'left',
            label: 'About',
          },
          {
            type: 'docSidebar',
            sidebarId: 'learnSidebar',
            position: 'left',
            label: 'Learn',
          },
          {
            type: 'docSidebar',
            sidebarId: 'devSidebar',
            position: 'left',
            label: 'Develop',
          },
          {
            href: 'https://discord.gg/Be7ukQcvrC',
            label: 'Discord Community',
            position: 'right',
          },  
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
                label: 'About',
                to: '/docs/about/',
              },
              {
                label: 'Learn',
                to: '/docs/learn/getting-started',
              },
              {
                label: 'Develop',
                to: 'docs/develop/install',
              }
            ],
          },
          {
            title: 'Authors',
            items: [
      
              {
                label: 'Contributors List',
                href: '/docs/about/contributors',
              },
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
                href: 'https://discord.gg/Be7ukQcvrC',
                label: 'Discord Community',
              },  
              {
                label: 'Creative Commons Attribution ShareAlike',
                href: 'https://creativecommons.org/licenses/by-sa/4.0/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Unstable Design Lab, Inc. Creative Commons Attribution ShareAlike.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
