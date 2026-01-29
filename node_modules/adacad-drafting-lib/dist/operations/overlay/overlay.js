"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overlay = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "overlay";
const meta = {
    displayname: 'overlay, (a,b) => (a OR b)',
    desc: 'Applies binary math to two drafts. To do so, it looks at each interlacement in input drafts a and b. If either interlacement a or b are marked as warp lifted, the resulting draft will have a warp raised in that location.',
    img: 'overlay.png',
    categories: [categories_1.computeOp],
    advanced: true,
    old_names: ['overlay', 'overlay, (a,b) => (a OR b)']
};
//PARAMS
const shift_ends = {
    name: 'shift ends',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: ''
};
const shift_pics = {
    name: 'shift pics',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: ''
};
const params = [shift_ends, shift_pics];
//INLETS
const draft_a = {
    name: 'a',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'all the drafts you would like to overlay another onto',
    num_drafts: 1
};
const draft_b = {
    name: 'b',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to overlay onto the base',
    num_drafts: 1
};
const inlets = [draft_a, draft_b];
const perform = (op_params, op_inputs) => {
    const input_draft_a = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const input_draft_b = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const shift_ends = (0, operations_1.getOpParamValById)(0, op_params);
    const shift_pics = (0, operations_1.getOpParamValById)(1, op_params);
    if (input_draft_a.length == 0 && input_draft_b.length == 0)
        return Promise.resolve([]);
    const draft_a = (input_draft_a.length == 0) ? (0, draft_1.initDraftFromDrawdown)([[(0, draft_1.createCell)(null)]]) : input_draft_a[0];
    const draft_b = (input_draft_b.length == 0) ? (0, draft_1.initDraftFromDrawdown)([[(0, draft_1.createCell)(null)]]) : input_draft_b[0];
    const height = Math.max((0, draft_1.wefts)(draft_b.drawdown) + shift_pics, (0, draft_1.wefts)(draft_a.drawdown));
    const width = Math.max((0, draft_1.warps)(draft_b.drawdown) + shift_ends, (0, draft_1.warps)(draft_a.drawdown));
    //offset draft b:
    const pattern_b = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < height; i++) {
        const seq = new sequence_1.Sequence.OneD();
        if (i < shift_pics) {
            seq.pushMultiple(2, width);
        }
        else if (i < (shift_pics + (0, draft_1.wefts)(draft_b.drawdown))) {
            seq.pushMultiple(2, shift_ends).pushRow(draft_b.drawdown[i - shift_pics]);
            const remaining = width - ((0, draft_1.warps)(draft_b.drawdown) + shift_ends);
            if (remaining > 0)
                seq.pushMultiple(2, remaining);
        }
        else {
            seq.pushMultiple(2, width);
        }
        pattern_b.pushWeftSequence(seq.val());
    }
    //make sure pattern a is the same size
    const pattern_a = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < height; i++) {
        const seq = new sequence_1.Sequence.OneD();
        if (i < (0, draft_1.wefts)(draft_a.drawdown)) {
            seq.pushRow(draft_a.drawdown[i]);
            const remaining = width - draft_a.drawdown[i].length;
            if (remaining > 0)
                seq.pushMultiple(2, remaining);
        }
        else {
            seq.pushMultiple(2, width);
        }
        pattern_a.pushWeftSequence(seq.val());
    }
    const pattern = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < height; i++) {
        const seq_a = new sequence_1.Sequence.OneD(pattern_a.getWeft(i));
        const seq_b = new sequence_1.Sequence.OneD(pattern_b.getWeft(i));
        seq_a.computeFilter('or', seq_b);
        pattern.pushWeftSequence(seq_a.val());
    }
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, draft_a);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, draft_a);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'overlay' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const input_draft_a = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const input_draft_b = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const shift_ends = (0, operations_1.getOpParamValById)(0, op_params);
    const shift_pics = (0, operations_1.getOpParamValById)(1, op_params);
    if (input_draft_a.length == 0 && input_draft_b.length == 0)
        return true;
    const draft_a = (input_draft_a.length == 0) ? (0, draft_1.initDraftFromDrawdown)([[(0, draft_1.createCell)(null)]]) : input_draft_a[0];
    const draft_b = (input_draft_b.length == 0) ? (0, draft_1.initDraftFromDrawdown)([[(0, draft_1.createCell)(null)]]) : input_draft_b[0];
    const height = Math.max((0, draft_1.wefts)(draft_b.drawdown) + shift_pics, (0, draft_1.wefts)(draft_a.drawdown));
    const width = Math.max((0, draft_1.warps)(draft_b.drawdown) + shift_ends, (0, draft_1.warps)(draft_a.drawdown));
    return (height * width) <= utils_1.defaults.max_area ? true : false;
};
exports.overlay = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=overlay.js.map