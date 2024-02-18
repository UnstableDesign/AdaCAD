export const defaults = {
    editor: 'draft',
    max_simulation_area: 10000,
    draft_detail_cell_size: 15,
    draft_detail_zoom: 1,
    draft_name: 'drafty',
    row_shuttle: 1,
    row_system: 0, 
    col_shuttle: 0, 
    col_system: 0,
    mixer_cell_size: 5,
    mixer_canvas_width: 16380,
    mixer_canvas_height: 16380,
    inlet_button_width: 50,
    weft_system_codes: ['a', 'b', 'c', 'd', 'e','f','g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    warps: 12,
    wefts: 12,
    epi: 12,
    units: 'in',
    show_materials: true,
    black_cell_up: true,
    number_threading: false,
    loom_type: 'frame',
    min_frames: 8,
    min_treadles: 8,
    selected_origin_option: 3,
    default_material_diameter: 1,
    hide_mixer_drafts: true,
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
      zoom_ndx: 3
}


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
  {value: 'toggle', viewValue: 'Invert Region', icon: "fas fa-adjust"},
  {value: 'up', viewValue: 'Set Region Heddles Up', icon: "fas fa-square"},
  {value: 'down', viewValue: 'Set Region Heddles Down', icon: "far fa-square"},
  {value: 'flip_x', viewValue: 'Vertical Flip', icon: "fas fa-arrows-alt-v"},
  {value: 'flip_y', viewValue: 'Horizontal Flip', icon: "fas fa-arrows-alt-h"},
  {value: 'shift_left', viewValue: 'Shift 1 Warp Left', icon: "fas fa-arrow-left"},
  {value: 'shift_up', viewValue: 'Shift 1 Pic Up', icon: "fas fa-arrow-up"},
  {value: 'copy', viewValue: 'Copy Selected Region', icon: "fa fa-clone"},
  {value: 'paste', viewValue: 'Paste Copyed Pattern to Selected Region', icon: "fa fa-paste"}
  ];
  