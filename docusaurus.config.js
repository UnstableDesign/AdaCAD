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

  // onBrokenLinks: 'warn',
  // onBrokenMarkdownLinks: 'ignore',


  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // ... other options for docs plugin
          async sidebarItemsGenerator({ defaultSidebarItemsGenerator, ...args }) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);

            // Example: Sort items alphabetically by their label
            const sortedItems = sidebarItems.sort((a, b) => {
              const labelA = a.label || a.id; // Use label if available, otherwise id
              const labelB = b.label || b.id;
              return labelA.localeCompare(labelB);
            });

            // You can also implement custom sorting logic here,
            // for example, to sort categories differently or based on other metadata.

            return sortedItems;
          },
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/UnstableDesign/AdaCAD_Documentation/tree/main',


        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),

        },
      },
    ],
  ],

  themes: [
    '@saucelabs/theme-github-codeblock'
  ],
  themeConfig:
    ({
      // announcementBar: {
      //   id: 'events',
      //   content:
      //     '🚀 The Newest Version of AdaCAD has Launched!  <a target="_blank" rel="noopener noreferrer" href="https://docs.adacad.org/docs/learn/workshops-and-events">Learn More at an upcoming Workshop</a>✨',
      //   backgroundColor: 'hotpink',
      //   textColor: '#000000',
      //   isCloseable: true,
      // },
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
            type: 'docSidebar',
            sidebarId: 'contributeSidebar',
            position: 'left',
            label: 'Contribute',
            className: 'contribute'
          },
          {
            href: 'https://discord.gg/Be7ukQcvrC',
            label: 'Discord Community',
            position: 'right',
          },
          {
            href: 'https://github.com/UnstableDesign/AdaCAD_Documentation/',
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
