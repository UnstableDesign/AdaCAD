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

  onBrokenLinks: 'throw', //throw
  onBrokenMarkdownLinks: 'throw',

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
      announcementBar: {
        id: 'events',
        content:
          '🚀 The Newest Version of AdaCAD has Launched!  <a target="_blank" rel="noopener noreferrer" href="https://docs.adacad.org/docs/learn/workshops-and-events">Learn More at an upcoming Workshop</a>✨',
        backgroundColor: 'hotpink',
        textColor: '#000000',
        isCloseable: true,
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 6,
      },
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
            className: 'about'
          },
          {
            type: 'docSidebar',
            sidebarId: 'learnSidebar',
            position: 'left',
            label: 'Learn',
            className: 'learn'
          },
          {
            type: 'docSidebar',
            sidebarId: 'devSidebar',
            position: 'left',
            label: 'Develop',
            className: 'develop'
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
      docs: {
        sidebar: {
          hideable: false,
          autoCollapseCategories: true,
        },
      }
      ,
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()} Unstable Design Lab, Inc. Creative Commons Attribution ShareAlike.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
