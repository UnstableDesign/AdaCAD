"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sierpinski_square = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "sierpinski_square";
const meta = {
    displayname: 'sierpinski square',
    desc: 'Created by Jenny Lin at the 2023 Textiles Jam, this operation implements an algorithm originally described by Sierpinski which subdivides a square into a cascading sequence of smaller and smaller rectangles.',
    img: 'sierpinski_square.png',
    categories: [categories_1.structureOp],
    advanced: true,
    authors: ['Jenny Lin'],
    urls: [{ url: 'https://en.wikipedia.org/wiki/Sierpi%C5%84ski_carpet', text: "More on Sierpinski Squares" }]
};
//PARAMS
const amt_size = {
    name: 'size',
    type: 'number',
    min: 1,
    max: 1000,
    value: 10,
    dx: 'size of the square'
};
const amt_recur = {
    name: 'recursion depth',
    type: 'number',
    min: 1,
    max: 10,
    value: 2,
    dx: 'how many holes you punch (recursively)'
};
const facing = {
    name: 'facing',
    type: 'boolean',
    falsestate: "A",
    truestate: "B",
    value: 0,
    dx: ''
};
const params = [amt_size, amt_recur, facing];
//INLETS
/*const draft_inlet: OperationInlet = {
    name: 'draft',
      type: 'static',
      value: null,
      dx: 'the draft to shift',
      uses: "draft",
      num_drafts: 1
  }*/
const inlets = [];
function punch_hole(draft, x, y, x_dim, y_dim, depth) {
    console.log("x: " + x + " y: " + y + " xdim: " + x_dim + " ydim: " + y_dim + " depth: " + depth);
    if (x_dim < 3 || y_dim < 3 || depth < 1) { //too small to punch hole
        return;
    }
    //Just going to assume everything in that region is one value for now
    const bg = draft[x][y].is_up;
    const hole = !bg;
    const out_x = (x_dim % 3 == 2) ? Math.ceil(x_dim / 3) : Math.floor(x_dim / 3);
    const mid_x = x_dim - 2 * out_x;
    const out_y = (y_dim % 3 == 2) ? Math.ceil(y_dim / 3) : Math.floor(y_dim / 3);
    const mid_y = y_dim - 2 * out_y;
    const x_corners = [x, x + out_x, x + out_x + mid_x];
    const y_corners = [y, y + out_y, y + out_y + mid_y];
    //punch out middle square
    for (let i = x_corners[1]; i < x_corners[2]; i++) {
        for (let j = y_corners[1]; j < y_corners[2]; j++) {
            draft[i][j].is_up = hole;
        }
    }
    //console.log("output");
    //console.log(draft);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (i == 1 && j == 1) { //skip middle square
                continue;
            } //recurse for surrounding squares 
            punch_hole(draft, x_corners[i], y_corners[j], i == 1 ? mid_x : out_x, j == 1 ? mid_y : out_y, depth - 1);
        }
    }
}
// what's actually called
const perform = (op_params) => {
    //let input_draft = getInputDraft(op_inputs);
    const amt_size = (0, operations_1.getOpParamValById)(0, op_params);
    const amt_recur = (0, operations_1.getOpParamValById)(1, op_params);
    const facing = (0, operations_1.getOpParamValById)(2, op_params);
    //if(input_draft == null) return Promise.resolve([]);
    /*let warp_systems = new Sequence.OneD(input_draft.colSystemMapping).shift(-amt_x);
 
    let warp_mats = new Sequence.OneD(input_draft.colShuttleMapping).shift(-amt_x);
 
    let weft_systems = new Sequence.OneD(input_draft.rowSystemMapping).shift(-amt_y);
 
    let weft_materials = new Sequence.OneD(input_draft.rowShuttleMapping).shift(-amt_y);*/
    const init = new sequence_1.Sequence.TwoD();
    init.setBlank(facing ? 1 : 0).fill(amt_size, amt_size);
    const pattern_data = init.export();
    punch_hole(pattern_data, 0, 0, amt_size, amt_size, amt_recur);
    console.log(pattern_data);
    const d = (0, draft_1.initDraftFromDrawdown)(pattern_data);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals) => {
    const amt_x = (0, operations_1.getOpParamValById)(0, param_vals);
    const amt_y = (0, operations_1.getOpParamValById)(1, param_vals);
    return 'sierpinski square' + amt_x + '/' + amt_y;
};
const sizeCheck = (op_settings) => {
    const amt_size = (0, operations_1.getOpParamValById)(0, op_settings);
    return (amt_size * amt_size <= utils_1.defaults.max_area) ? true : false;
};
exports.sierpinski_square = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=sierpinski_square.js.map