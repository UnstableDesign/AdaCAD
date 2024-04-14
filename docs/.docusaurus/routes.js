import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', '917'),
    exact: true
  },
  {
    path: '/blog/2021/04/21/press-button',
    component: ComponentCreator('/blog/2021/04/21/press-button', 'cea'),
    exact: true
  },
  {
    path: '/blog/2021/07/15/electrodes',
    component: ComponentCreator('/blog/2021/07/15/electrodes', 'b0e'),
    exact: true
  },
  {
    path: '/blog/2024/02/22/progress-update',
    component: ComponentCreator('/blog/2024/02/22/progress-update', '900'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '409'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', 'aad'),
    exact: true
  },
  {
    path: '/blog/tags/adacad-4-0',
    component: ComponentCreator('/blog/tags/adacad-4-0', 'bb2'),
    exact: true
  },
  {
    path: '/blog/tags/circuitry',
    component: ComponentCreator('/blog/tags/circuitry', '7d8'),
    exact: true
  },
  {
    path: '/blog/tags/docusaurus',
    component: ComponentCreator('/blog/tags/docusaurus', '390'),
    exact: true
  },
  {
    path: '/blog/tags/double-weaving',
    component: ComponentCreator('/blog/tags/double-weaving', '28c'),
    exact: true
  },
  {
    path: '/blog/tags/electrodes',
    component: ComponentCreator('/blog/tags/electrodes', 'be6'),
    exact: true
  },
  {
    path: '/blog/tags/howto',
    component: ComponentCreator('/blog/tags/howto', '6f6'),
    exact: true
  },
  {
    path: '/blog/tags/mixer',
    component: ComponentCreator('/blog/tags/mixer', 'cc3'),
    exact: true
  },
  {
    path: '/blog/tags/press-button',
    component: ComponentCreator('/blog/tags/press-button', '720'),
    exact: true
  },
  {
    path: '/blog/tags/software-updates',
    component: ComponentCreator('/blog/tags/software-updates', '87c'),
    exact: true
  },
  {
    path: '/blog/tags/version-2-0',
    component: ComponentCreator('/blog/tags/version-2-0', 'b63'),
    exact: true
  },
  {
    path: '/blog/wafflesensor',
    component: ComponentCreator('/blog/wafflesensor', '709'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'df2'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '55a'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '720'),
            routes: [
              {
                path: '/docs/category/examples',
                component: ComponentCreator('/docs/category/examples', 'c5b'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/install',
                component: ComponentCreator('/docs/howtodevelop/install', '18d'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/makeanoperation',
                component: ComponentCreator('/docs/howtodevelop/makeanoperation', 'f6d'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/cell/',
                component: ComponentCreator('/docs/howtodevelop/reference/cell/', 'f94'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/cell/createCell',
                component: ComponentCreator('/docs/howtodevelop/reference/cell/createCell', 'eb3'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/cell/getCellValue',
                component: ComponentCreator('/docs/howtodevelop/reference/cell/getCellValue', 'df4'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/cell/setCellValue',
                component: ComponentCreator('/docs/howtodevelop/reference/cell/setCellValue', '73d'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/', 'bfe'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/copyDraft',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/copyDraft', '164'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/initDraft',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/initDraft', '173'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/initDraftFromDrawdown',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/initDraftFromDrawdown', '5d5'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/initDraftWithParams',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/initDraftWithParams', '806'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/updateWarpSystemsAndShuttles',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/updateWarpSystemsAndShuttles', 'dc7'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/draft/updateWeftSystemsAndShuttles',
                component: ComponentCreator('/docs/howtodevelop/reference/draft/updateWeftSystemsAndShuttles', '5e4'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/drawdown/',
                component: ComponentCreator('/docs/howtodevelop/reference/drawdown/', '95e'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/drawdown/hasCell',
                component: ComponentCreator('/docs/howtodevelop/reference/drawdown/hasCell', 'f6b'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/drawdown/isUp',
                component: ComponentCreator('/docs/howtodevelop/reference/drawdown/isUp', '998'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/drawdown/setCellValue',
                component: ComponentCreator('/docs/howtodevelop/reference/drawdown/setCellValue', 'd80'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/drawdown/warps',
                component: ComponentCreator('/docs/howtodevelop/reference/drawdown/warps', 'a8b'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/drawdown/wefts',
                component: ComponentCreator('/docs/howtodevelop/reference/drawdown/wefts', 'f46'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/loom/',
                component: ComponentCreator('/docs/howtodevelop/reference/loom/', '379'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/operation/',
                component: ComponentCreator('/docs/howtodevelop/reference/operation/', '213'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/operation/dynamicoperation',
                component: ComponentCreator('/docs/howtodevelop/reference/operation/dynamicoperation', 'f81'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/', 'f8b'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/', '2b8'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/computerFilter',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/computerFilter', '1a0'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/import',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/import', 'df0'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/invert',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/invert', 'd02'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/matchSize',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/matchSize', '8c1'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/padTo',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/padTo', '2c6'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/push',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/push', '5f2'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/pushMultiple',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/pushMultiple', 'daf'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/resize',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/resize', '2a2'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/unshift',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/unshift', 'e58'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/unshiftMultiple',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/unshiftMultiple', 'b4b'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/OneD/val',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/OneD/val', '6b6'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtodevelop/reference/sequence/TwoD/',
                component: ComponentCreator('/docs/howtodevelop/reference/sequence/TwoD/', '6c6'),
                exact: true,
                sidebar: "devDocsSidebar"
              },
              {
                path: '/docs/howtouse/examples/inlay',
                component: ComponentCreator('/docs/howtouse/examples/inlay', '09a'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/examples/lattice-tutorial',
                component: ComponentCreator('/docs/howtouse/examples/lattice-tutorial', '0ea'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/examples/picture-weaving',
                component: ComponentCreator('/docs/howtouse/examples/picture-weaving', '463'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/examples/quick-tc2',
                component: ComponentCreator('/docs/howtouse/examples/quick-tc2', '085'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/getting-started',
                component: ComponentCreator('/docs/howtouse/getting-started', 'b63'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/',
                component: ComponentCreator('/docs/howtouse/glossary/', 'e55'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/bitmap-image',
                component: ComponentCreator('/docs/howtouse/glossary/bitmap-image', '99a'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/cloth',
                component: ComponentCreator('/docs/howtouse/glossary/cloth', '4e2'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/direct-tie-loom',
                component: ComponentCreator('/docs/howtouse/glossary/direct-tie-loom', 'd76'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/draft',
                component: ComponentCreator('/docs/howtouse/glossary/draft', '952'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/drawdown',
                component: ComponentCreator('/docs/howtouse/glossary/drawdown', 'd0b'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/end',
                component: ComponentCreator('/docs/howtouse/glossary/end', 'a19'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/harness-loom',
                component: ComponentCreator('/docs/howtouse/glossary/harness-loom', 'd22'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/inlet',
                component: ComponentCreator('/docs/howtouse/glossary/inlet', '34b'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/jacquard-loom',
                component: ComponentCreator('/docs/howtouse/glossary/jacquard-loom', 'da7'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/layer-notation',
                component: ComponentCreator('/docs/howtouse/glossary/layer-notation', '956'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/loom',
                component: ComponentCreator('/docs/howtouse/glossary/loom', '33f'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/operation',
                component: ComponentCreator('/docs/howtouse/glossary/operation', '700'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/outlet',
                component: ComponentCreator('/docs/howtouse/glossary/outlet', 'dab'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/parameter',
                component: ComponentCreator('/docs/howtouse/glossary/parameter', 'aad'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/parametric-design',
                component: ComponentCreator('/docs/howtouse/glossary/parametric-design', '694'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/pick',
                component: ComponentCreator('/docs/howtouse/glossary/pick', '28b'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/structure',
                component: ComponentCreator('/docs/howtouse/glossary/structure', '733'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/warp',
                component: ComponentCreator('/docs/howtouse/glossary/warp', '4da'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/warp-lowered',
                component: ComponentCreator('/docs/howtouse/glossary/warp-lowered', 'ae8'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/warp-raised',
                component: ComponentCreator('/docs/howtouse/glossary/warp-raised', '65b'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/warp-system',
                component: ComponentCreator('/docs/howtouse/glossary/warp-system', '4ba'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/weft',
                component: ComponentCreator('/docs/howtouse/glossary/weft', '091'),
                exact: true,
                sidebar: "userDocsSidebar"
              },
              {
                path: '/docs/howtouse/glossary/weft-system',
                component: ComponentCreator('/docs/howtouse/glossary/weft-system', 'b9f'),
                exact: true,
                sidebar: "userDocsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'db9'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
