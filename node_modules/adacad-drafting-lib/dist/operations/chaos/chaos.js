"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaos = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "chaos";
const meta = {
    displayname: "chaos sequence",
    categories: [categories_1.clothOp],
    desc: "Made in collaboration Jacqueline Wernimont, Molly Morin and Nikki Stevens to explore non-deterministic drafts. Tiles the input drafts, randomly selecting which draft to place at which position. At each position, it randomly rotates the draft by either 90, 180 or 270 degrees. ",
    img: "chaos.png"
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
const params = [warp_repeats, weft_repeats];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    dx: 'the draft to tile in the chaos sequence',
    uses: 'draft',
    num_drafts: -1
};
const inlets = [draft_inlet];
const perform = async (op_params, op_inputs) => {
    const input_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const warp_rep = (0, operations_1.getOpParamValById)(0, op_params);
    const weft_rep = (0, operations_1.getOpParamValById)(1, op_params);
    if (input_drafts.length == 0)
        return Promise.resolve([]);
    const all_warps = input_drafts.map(el => (0, draft_1.warps)(el.drawdown)).filter(el => el > 0);
    const total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    const all_wefts = input_drafts.map(el => (0, draft_1.wefts)(el.drawdown)).filter(el => el > 0);
    const total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    const num_inputs = input_drafts.length;
    const draft_indexing_fns = [];
    //randomly grab one of the inputs
    let ndx = Math.floor(Math.random() * num_inputs);
    for (let i = 0; i < weft_rep; i++) {
        for (let j = 0; j < warp_rep; j++) {
            const x_flip = (Math.random() < 0.5) ? false : true;
            const y_flip = (Math.random() < 0.5) ? false : true;
            draft_indexing_fns.push((0, draft_1.flipDraft)(input_drafts[ndx], x_flip, y_flip));
            ndx = Math.floor(Math.random() * num_inputs);
        }
    }
    return Promise.all(draft_indexing_fns).then(all_flips => {
        const pattern = new sequence_1.Sequence.TwoD();
        for (let di = 0; di < weft_rep; di++) {
            const drafts_on_row = all_flips.filter((el, ndx) => (ndx >= warp_rep * di && ndx < warp_rep * di + warp_rep));
            for (let i = 0; i < total_wefts; i++) {
                const seq = new sequence_1.Sequence.OneD();
                drafts_on_row
                    .forEach(draft_on_row => {
                    const selected_row = draft_on_row.drawdown[i % (0, draft_1.wefts)(draft_on_row.drawdown)];
                    const expanded = new sequence_1.Sequence.OneD(selected_row.map(cell => (0, draft_1.cellToSequenceVal)(cell))).resize(total_warps);
                    seq.pushRow(expanded.val());
                });
                pattern.pushWeftSequence(seq.val());
            }
        }
        let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
        d = (0, draft_1.updateWeftSystemsAndShuttles)(d, input_drafts[0]);
        d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_drafts[0]);
        return Promise.resolve([{ draft: d }]);
    });
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'chaos(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const input_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (input_drafts.length == 0)
        return true;
    const all_warps = input_drafts.map(el => (0, draft_1.warps)(el.drawdown)).filter(el => el > 0);
    const total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    const all_wefts = input_drafts.map(el => (0, draft_1.wefts)(el.drawdown)).filter(el => el > 0);
    const total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    const warp_rep = (0, operations_1.getOpParamValById)(0, op_params);
    const weft_rep = (0, operations_1.getOpParamValById)(1, op_params);
    const area = total_warps * total_wefts * warp_rep * weft_rep;
    return (area <= utils_1.defaults.max_area ? true : false);
};
exports.chaos = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=chaos.js.map