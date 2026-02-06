"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagemap = void 0;
const draft_1 = require("../../draft");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "imagemap";
const meta = {
    displayname: 'image map',
    categories: [categories_1.clothOp],
    advanced: true,
    desc: 'Uploads an image and creates an input for each color found in the image. Assigning a draft to the color fills the color region with the selected draft.',
    img: 'imagemap.png'
};
const dynamic_param_id = 0;
const dynamic_param_type = 'color';
//PARAMS
//the value on this param needs to hold all the image data
const file = {
    name: 'image file (.jpg or .png)',
    type: 'file',
    value: { id: '', data: null },
    dx: 'the file to upload',
};
const width = {
    name: 'draft width',
    type: 'number',
    min: 1,
    max: 10000,
    value: 30,
    dx: 'resize the input image to the width specified'
};
const height = {
    name: 'draft height',
    type: 'number',
    min: 1,
    max: 10000,
    value: 20,
    dx: 'resize the input image to the height specified'
};
const params = [file, width, height];
//INLETS
const inlets = [];
const perform = (op_params, op_inputs) => {
    var _a;
    const file_param = (0, operations_1.getOpParamValById)(0, op_params);
    const res_w = (0, operations_1.getOpParamValById)(1, op_params);
    const res_h = (0, operations_1.getOpParamValById)(2, op_params);
    if (file_param.id == '' || file_param.data == null) {
        const d = (0, draft_1.initDraftWithParams)({ wefts: res_w, warps: res_h, drawdown: [[(0, draft_1.createCell)(false)]] });
        return Promise.resolve([{ draft: d }]);
    }
    const data = file_param.data;
    //coorelates the inlet with an associated draft
    const color_to_drafts = data.colors.map((color) => {
        const child_of_color = op_inputs.find(input => (input.inlet_params.findIndex(param => param === color.hex) !== -1));
        if (child_of_color === undefined)
            return { color: color.hex, draft: null };
        else
            return { color: color.hex, draft: child_of_color.drafts[0] };
    });
    const pattern = [];
    for (let i = 0; i < res_h; i++) {
        pattern.push([]);
        for (let j = 0; j < res_w; j++) {
            const i_ratio = data.height / res_h;
            const j_ratio = data.width / res_w;
            const map_i = Math.floor(i * i_ratio);
            const map_j = Math.floor(j * j_ratio);
            const color_ndx = data.image_map[map_i][map_j]; //this is an id
            const mapped_color = (_a = data.colors_mapping.find(el => el.from == color_ndx)) !== null && _a !== void 0 ? _a : { to: 0 }; //this is the mapped id
            const mapped_color_hex = data.colors[mapped_color.to].hex;
            const found_color = color_to_drafts.find(el => el.color == mapped_color_hex);
            const color_draft = found_color ? found_color.draft : null;
            // if(i == 0){
            //   console.log("COLOR, MAP, DRAFT", color_ndx, mapped_color, color_to_drafts[mapped_color.to], color_draft)
            // }
            if (color_draft === null)
                pattern[i].push((0, draft_1.createCell)(false));
            else {
                const draft_i = i % (0, draft_1.wefts)(color_draft.drawdown);
                const draft_j = j % (0, draft_1.warps)(color_draft.drawdown);
                pattern[i].push((0, draft_1.createCell)((0, draft_1.getHeddle)(color_draft.drawdown, draft_i, draft_j)));
            }
        }
    }
    const draft = (0, draft_1.initDraftFromDrawdown)(pattern);
    return Promise.resolve([{ draft }]);
};
const generateName = (param_vals) => {
    // const image_data = getImageData(getOpParamValById(0, param_vals));
    const file_param = (0, operations_1.getOpParamValById)(0, param_vals);
    if (file_param.id == '' || file_param.data == null) {
        return 'image';
    }
    else {
        return file_param.data.name;
    }
};
const onParamChange = (param_vals, static_inlets, inlet_vals, changed_param_id, dynamic_param_val) => {
    var _a;
    const new_inlets = [];
    //a new file was uploaded
    if (changed_param_id == 0) {
        const id_and_data = (_a = dynamic_param_val) !== null && _a !== void 0 ? _a : { id: '', data: null };
        if (id_and_data.id !== '') {
            const color_space = (id_and_data.data) ? id_and_data.data.colors : [];
            const colors_mapping = (id_and_data.data) ? id_and_data.data.colors_mapping : [];
            const unique_colors = (0, utils_1.filterToUniqueValues)(colors_mapping.map(el => el.to));
            //compute the distance between each pair of colors, keep the N closest values
            unique_colors.forEach(id => {
                new_inlets.push(color_space[id].hex);
            });
        }
    }
    return new_inlets;
};
const sizeCheck = (op_params) => {
    const res_w = (0, operations_1.getOpParamValById)(1, op_params);
    const res_h = (0, operations_1.getOpParamValById)(2, op_params);
    return (res_w * res_h <= utils_1.defaults.max_area) ? true : false;
};
exports.imagemap = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange, sizeCheck };
//# sourceMappingURL=imagemap.js.map