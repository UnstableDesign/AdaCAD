"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tile = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "tile";
const meta = {
    displayname: 'tile',
    desc: 'Repeats the input block along the warp and weft according to the parameters described below.',
    img: 'tile.png',
    categories: [categories_1.clothOp],
    advanced: true
};
//PARAMS
const warp_repeats = {
    name: 'warp-repeats',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'the number of times to repeat this time across the width'
};
const weft_repeats = {
    name: 'weft-repeats',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'the number of times to repeat this time across the length'
};
const mode = {
    name: 'mode',
    type: 'select',
    selectlist: [
        { name: 'horizontal brick', value: 0 },
        { name: 'vertical brick', value: 1 }
    ],
    value: 0,
    dx: 'the mode to repeat the draft in'
};
const offset = {
    name: 'offset',
    type: 'number',
    min: 0,
    max: 100,
    value: 0,
    dx: 'the portion of this draft that will be staggered as a percentage'
};
const params = [warp_repeats, weft_repeats, mode, offset];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to tile',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    const warp_rep = (0, operations_1.getOpParamValById)(0, op_params);
    const weft_rep = (0, operations_1.getOpParamValById)(1, op_params);
    const mode = (0, operations_1.getOpParamValById)(2, op_params);
    const offset = (0, operations_1.getOpParamValById)(3, op_params);
    const w = warp_rep * (0, draft_1.warps)(input_draft.drawdown);
    const h = weft_rep * (0, draft_1.wefts)(input_draft.drawdown);
    const seq = new sequence_1.Sequence.TwoD();
    seq.import(input_draft.drawdown).fill(w, h);
    const weft_shift = Math.floor(offset / 100 * (0, draft_1.warps)(input_draft.drawdown));
    const warp_shift = Math.floor(offset / 100 * (0, draft_1.wefts)(input_draft.drawdown));
    switch (mode) {
        case 0: //horizontal brick
            for (let repeat = 0; repeat < weft_rep; repeat++) {
                for (let i = 0; i < (0, draft_1.wefts)(input_draft.drawdown); i++) {
                    seq.shiftRow(repeat * (0, draft_1.wefts)(input_draft.drawdown) + i, weft_shift * repeat);
                }
            }
            break;
        case 1: //vertical
            for (let repeat = 0; repeat < warp_rep; repeat++) {
                for (let j = 0; j < (0, draft_1.warps)(input_draft.drawdown); j++) {
                    seq.shiftCol(repeat * (0, draft_1.warps)(input_draft.drawdown) + j, warp_shift * repeat);
                }
            }
            break;
    }
    let d = (0, draft_1.initDraftFromDrawdown)(seq.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, input_draft);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'tile(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return true;
    const warp_rep = (0, operations_1.getOpParamValById)(0, op_params);
    const weft_rep = (0, operations_1.getOpParamValById)(1, op_params);
    const w = warp_rep * (0, draft_1.warps)(input_draft.drawdown);
    const h = weft_rep * (0, draft_1.wefts)(input_draft.drawdown);
    return (w * h <= utils_1.defaults.max_area) ? true : false;
};
exports.tile = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=tile.js.map