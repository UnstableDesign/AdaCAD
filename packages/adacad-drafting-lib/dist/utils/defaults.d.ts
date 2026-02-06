import { DraftCellColor } from "../media/types";
export declare const defaults: {
    lcm_timeout: number;
    max_area: number;
    draft_detail_cell_size: number;
    draft_name: string;
    row_shuttle: number;
    row_system: number;
    col_shuttle: number;
    col_system: number;
    weft_system_codes: string[];
    warps: number;
    wefts: number;
    show_materials: boolean;
    black_cell_up: boolean;
    number_threading: boolean;
    selected_origin_option: number;
    default_material_diameter: number;
    hide_mixer_drafts: boolean;
    loom_settings: {
        frames: number;
        treadles: number;
        epi: number;
        ppi: number;
        units: string;
        type: string;
    };
    largest_lcm_factor: number;
    material_type: number;
};
/** sets the default cell color for cells in the drawdown */
export declare const rendering_color_defaults: Array<DraftCellColor>;
export declare const origin_option_list: Array<{
    value: number;
    view: string;
}>;
export declare const draft_view_modes: {
    value: string;
    viewValue: string;
}[];
export declare const loom_types: {
    value: string;
    viewValue: string;
}[];
export declare const density_units: {
    value: string;
    viewValue: string;
}[];
export declare const draft_edit_source: {
    value: string;
    viewValue: string;
}[];
export declare const draft_pencil: {
    value: string;
    viewValue: string;
    icon: string;
}[];
export declare const draft_edit_mode: {
    value: string;
    viewValue: string;
    icon: string;
}[];
export declare const mixer_edit_mode: {
    value: string;
    viewValue: string;
    icon: string;
}[];
export declare const paste_options: {
    value: string;
    viewValue: string;
    icon: string;
    drawdown: boolean;
    threading: boolean;
    treadling: boolean;
    tieups: boolean;
    materials: boolean;
    systems: boolean;
}[];
export declare const licenses: {
    value: string;
    viewValue: string;
    img: string;
    desc: string;
}[];
export declare const setLCMTimeout: (timeout: number) => void;
export declare const setMaxArea: (max_area: number) => void;
