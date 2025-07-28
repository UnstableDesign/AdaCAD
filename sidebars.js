/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */


const sidebars = {



  // By default, Docusaurus generates a sidebar from the docs folder structure
  aboutSidebar: [
    {
      type: 'doc',
      id: 'about/about', // document ID
      label: 'About', // sidebar label
    },
    {
      type: 'doc',
      id: 'about/contributors', // document ID
      label: 'Contributors', // sidebar label
    },
    {
      type: 'doc',
      id: 'about/research', // document ID
      label: 'Research', // sidebar label
    }
  ],
  contributeSidebar: [{
    type: 'category',
    label: 'Contribute',
    collapsed: false,
    collapsible: false,
    link: {type: 'doc', id:'contribute/contribute'},
        items: [
          'contribute/contribute',
          'contribute/donate'
        ],
  }
  ],
  learnSidebar: [
    {
      type: 'html',
      value: 'Get Started',
      defaultStyle: true,
      className: 'sidebarHeading'
    },
    {
      type: 'doc',
      id: 'learn/getting-started/getting-started', // document ID
      label: 'How to AdaCAD', // sidebar label
    },
    {
      type: 'doc',
      id: 'learn/workshops-and-events', // document ID
      label: 'Workshops and Events', // sidebar label
    },
    {
      type: 'category',
      label: 'Tutorials', 
      collapsed: true,
      collapsible: true,
      link: {type: 'doc', id:'learn/tutorials/index'},
        items: [
          'learn/tutorials/figured_weaving_tc2',
          'learn/tutorials/block_threading',
          'learn/tutorials/weave_tc2',
          'learn/tutorials/weave_avl'
        ],
    },
    {
      type: 'category',
      label: 'Research Projects', 
      collapsed: true,
      collapsible: true,
      link: {type: 'doc', id:'learn/examples/index'},
      items: [
        'learn/examples/lattice-tutorial',
        'learn/examples/hygromorphic-linen',
        'learn/examples/forcepocket',
      ],
    },

{
  type: 'html',
  value: 'Reference',
  defaultStyle: true,
  className: 'sidebarHeading'
},

//insert reference sidebar
{ 
  type:'category',
  label: 'Operations (A-Z)',
  collapsed: true,
  collapsible: true,
  link: {type: 'doc', id: 'reference/operations/index'},
  items:[ 
    { type: 'html',
      value: 'Structure',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/combos',
      'reference/operations/complextwill',
      'reference/operations/glitchsatin',
      'reference/operations/random',
      'reference/operations/satin',
      'reference/operations/satinish',
      'reference/operations/shaded_satin',
      'reference/operations/sine',
      'reference/operations/tabbyder',
      'reference/operations/twill',
      'reference/operations/bwimagemap',
      'reference/operations/waffle',
      'reference/operations/waffleish',

    { type: 'html',
      value: 'Transformation',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/margin',
      'reference/operations/clear',
      'reference/operations/crop',
      "reference/operations/flip",
      'reference/operations/invert',
      'reference/operations/makesymmetric',
      'reference/operations/rotate',
      'reference/operations/set_down_to_unset',
      'reference/operations/set_unset',
      'reference/operations/slope',
      'reference/operations/stretch',
      'reference/operations/undulatewarps',
      'reference/operations/undulatewefts',

    { type: 'html',
      value: 'Cloth',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/chaos',
      "reference/operations/fill",
      'reference/operations/imagemap',
      'reference/operations/join_left',
      'reference/operations/join_top',
      'reference/operations/weft_profile',
      'reference/operations/warp_profile',
      'reference/operations/rectangle',  
      'reference/operations/sample_length',
      'reference/operations/sample_width',  
      'reference/operations/tile',
      'reference/operations/warp_profile',
      'reference/operations/weft_profile',

    { type: 'html',
      value: 'Compound',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/assign_systems',
      'reference/operations/interlacewarps',
      'reference/operations/interlace',
      'reference/operations/layer',
      'reference/operations/notation',
      'reference/operations/overlay_multiple',
      'reference/operations/splice_in_warps',
      'reference/operations/splice_in_wefts',

    { type: 'html',
      value: 'Dissect',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/deinterlace',


    { type: 'html',
      value: 'Compute',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/cutout',
      'reference/operations/diff',
      'reference/operations/mask',
      'reference/operations/overlay',
      'reference/operations/atop',




    { type: 'html',
      value: 'Helper',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/bind_warp_floats',
      'reference/operations/bind_weft_floats',
      "reference/operations/erase_blank_rows",
      'reference/operations/selvedge',

    { type: 'html',
      value: 'Color Effects',
      defaultStyle: true,
      className: 'subSidebarHeading'},
      'reference/operations/apply_materials',
      'reference/operations/apply_warp_materials',
      'reference/operations/apply_weft_materials',

    { type: 'html',
      value: 'Drafting Styles',
      defaultStyle: true,
      className: 'subSidebarHeading'},
    'reference/operations/direct_loom',
    'reference/operations/floor_loom',
    'reference/operations/directdrawdown',
    'reference/operations/drawdown',
  ]
},
{
  type: 'category',
  label: 'Glossary',
  collapsed: true,
  collapsible: true,
  link: {type: 'doc', id: 'reference/glossary/index'},
  items: [
    
    {type:'autogenerated',
    dirName:'reference/glossary'}
  ]
},
{
  type: 'category',
  label: 'Interface',
  collapsed:true,
  collapsible:true,
  link: {type: 'doc', id: 'reference/interface/index'},
  items: [
    'reference/interface/topbar',
    'reference/interface/workspace',
    'reference/interface/draft_editor',
    'reference/interface/viewer'
    ]
},


// end reference sidebar
    ],

 
  devSidebar: [
    {type: 'autogenerated', 
      dirName: 'develop'}]
};

module.exports = sidebars;
