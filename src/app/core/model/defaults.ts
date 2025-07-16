import { DraftCellColor } from "./datatypes";

export const defaults = {
    editor: 'mixer',
    max_simulation_area: 10000,
    draft_detail_cell_size: 20,
    draft_name: 'drafty',
    row_shuttle: 1,
    row_system: 0, 
    col_shuttle: 0, 
    col_system: 0,
    mixer_canvas_width: 16380,
    mixer_canvas_height: 16380,
    inlet_button_width: 50,
    weft_system_codes: ['a', 'b', 'c', 'd', 'e','f','g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    warps: 12,
    wefts: 12,
    show_materials: true,
    black_cell_up: true,
    number_threading: false,
    selected_origin_option: 3,
    default_material_diameter: 1,
    hide_mixer_drafts: false,
    loom_settings:  {
            frames: 8,
            treadles: 8,
            epi: 12,
            units: <'in'> 'in',
            type: 'frame'
          },
      draft_edit_source: 'loom',
      pencil: 'toggle',
      draft_edit_mode: 'draw',
      mixer_mode: 'move',
      zoom_ndx_mixer: 10,
      zoom_ndx_editor: 12,
      zoom_ndx_viewer: 10,
      show_advanced_operations: false,
      share_url_base: 'https://adacad.org/?share=',
      force_jacquard_threshold: 10000,
      largest_lcm_factor: 500,
      //SIM DEFAULTS
      wefts_as_written: false,
      layer_spacing: 10, 
      pack: 100


}

/** sets the default cell color for cells in the drawdown */
export const rendering_color_defaults: Array<DraftCellColor> =  [
    {
      id: 'down',
      r: 255, 
      g: 255, 
      b: 255, 
      a: 255 
    },
    {
      id: 'up',
      r: 0, 
      g: 0, 
      b: 0, 
      a: 255 
    },
    {
      id: 'unset',
      r: 0, 
      g: 0, 
      b: 0, 
      a: 255 
    },
    {
      id: 'edge',
      r: 150, 
      g: 150, 
      b: 150, 
      a: 255 
    } 
  ];



export const origin_option_list: Array<{value: number, view: string}> = 
[
  {value: 0, view: 'top right'},
  {value: 1, view: 'bottom right'},
  {value: 2, view: 'bottom left'},
  {value: 3, view: 'top left'},
];

export const editor_modes: Array<{value: string, view: string}> = 
[
  {value: 'draft', view: 'draft'},
  {value: 'mixer', view: 'workspace'},
];

export const draft_view_modes = [
  {value: 'draft', viewValue: 'Draft'}, //black and white individual cells
  {value: 'structure', viewValue: 'Structure'}, //single color outlines of floats
  {value: 'visual', viewValue: 'Visual Pattern'}];


export const loom_types = [
  {value: 'direct', viewValue: 'Direct Tieup Loom'},
  {value: 'frame', viewValue: 'Shaft/Treadle Loom'},
  {value: 'jacquard', viewValue: 'Jacquard'},
];

export const density_units = [
  {value: 'in', viewValue: 'Ends per Inch'},
  {value: 'cm', viewValue: 'Ends per 10cm '}
];


export const draft_edit_source = [
  {value: 'drawdown', viewValue: 'Drawdown'},
  {value: 'loom', viewValue: 'Loom Configuration'}
];

export const draft_pencil = [
  {value: 'toggle', viewValue: 'Toggle Heddle', icon: "fas fa-adjust"},
  {value: 'up', viewValue: 'Set Heddle Up', icon: "fas fa-square"},
  {value: 'down', viewValue: 'Set Heddle Down', icon: "far fa-square"},
  {value: 'unset', viewValue: 'Unset Heddle', icon: "far fa-times"},
  {value: 'material', viewValue: 'Draw Material', icon: "fas fa-pen"}
]

export const draft_edit_mode = [
  {value: 'draw', viewValue: 'Draw', icon: "fas fa-pen"},
  {value: 'select', viewValue: 'Select', icon: "fas fa-expand"}
]

export const mixer_edit_mode = [
  {value: 'pan', viewValue: 'Pan', icon: "fas fa-hand"},
  {value: 'move', viewValue: 'Move', icon: "fas fa-arrows-alt"},
  {value: 'select', viewValue: 'Select', icon: "fas fa-expand"},
]

export const paste_options = [
  {value: 'erase', viewValue: 'Erase', icon: "fa-solid fa-eraser",drawdown: true, threading: true, treadling: true, tieups: true, materials: false, systems: false},
  {value: 'invert', viewValue: 'Invert Region', icon: "fas fa-adjust", drawdown: true, threading: false, treadling: true, tieups: true, materials: false, systems: false},
  {value: 'flip_x', viewValue: 'Vertical Flip', icon: "fas fa-arrows-alt-v",drawdown: true, threading: true, treadling: true, tieups: true, materials: false, systems: false},
  {value: 'flip_y', viewValue: 'Horizontal Flip', icon: "fas fa-arrows-alt-h",drawdown: true, threading: true, treadling: true, tieups: true, materials: false, systems: false},
  {value: 'shift_left', viewValue: 'Shift 1 Warp Left', icon: "fas fa-arrow-left",drawdown: true, threading: true, treadling: true, tieups: true, materials: false, systems: false},
  {value: 'shift_up', viewValue: 'Shift 1 Pic Up', icon: "fas fa-arrow-up",drawdown: true, threading: true, treadling: true, tieups: true, materials: false, systems: false},
  {value: 'copy', viewValue: 'Copy Selected Region', icon: "fa fa-clone",drawdown: true, threading: true, treadling: true, tieups: true, materials: true, systems: true},
  {value: 'paste', viewValue: 'Paste Copied Pattern to Selected Region', icon: "fa fa-paste",drawdown: true, threading: true, treadling: true, tieups: true, materials: true, systems: true}
  ];
  
  export const licenses = [
    {value: 'by', viewValue: 'CC BY', img: "by.png", desc:"This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use."},
    {value: 'by-sa', viewValue: 'CC BY-SA', img: "by-sa.png", desc: "This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms."},
    {value: 'by-nc', viewValue: 'CC BY-NC', img: "by-nc.png", desc: "This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator."},
    {value: 'by-nc-sa', viewValue: 'CC BY-NC-SA', img: "by-nc-sa.png", desc: "This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms."},
    {value: 'by-nd', viewValue: 'CC BY-ND', img: "by-nd.png", desc: "This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use."},
    {value: 'by-nc-nd', viewValue: 'CC BY-NC-ND', img: "by-nc-nd.png", desc: "This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator. "},
    {value: 'cc-zero', viewValue: 'CC0', img: "cc-zero.png", desc: "CC0 (aka CC Zero) is a public dedication tool, which enables creators to give up their copyright and put their works into the worldwide public domain. CC0 enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, with no conditions."},
  ]