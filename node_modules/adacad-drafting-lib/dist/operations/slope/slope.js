"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slope = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "slope";
const meta = {
    displayname: 'slope',
    desc: 'Shifts every nth pic by the value given in ends. It is an application of the mathematical principle of the slope of a line (e.g. rise/run) to drafting (every x picks, move y ends to the right)',
    img: 'slope.png',
    categories: [categories_1.transformationOp]
};
//PARAMS
const end_shift = {
    name: 'end shift',
    type: 'number',
    min: -5000,
    max: 5000,
    value: 1,
    dx: 'the amount to shift rows by'
};
const pic_shift = {
    name: 'pic shift (n)',
    type: 'number',
    min: -5000,
    max: 5000,
    value: 1,
    dx: 'describes how many rows we should apply the shift to'
};
const params = [end_shift, pic_shift];
//INLETS
const draft_input = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to slope',
    num_drafts: 1
};
const inlets = [draft_input];
const perform = (param_vals, op_inputs) => {
    const end_shift = (0, operations_1.getOpParamValById)(0, param_vals);
    const pic_shift = (0, operations_1.getOpParamValById)(1, param_vals);
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return Promise.resolve([]);
    const pattern = new sequence_1.Sequence.TwoD();
    drafts[0].drawdown.forEach((row, i) => {
        let row_shift = 0;
        if (pic_shift > 0)
            row_shift = Math.floor(i / pic_shift) * end_shift;
        pattern.pushWeftSequence(new sequence_1.Sequence.OneD().import(row).shift(row_shift).val());
    });
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, drafts[0]);
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, drafts[0]);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals) => {
    const end_shift = (0, operations_1.getOpParamValById)(0, param_vals);
    const pic_shift = (0, operations_1.getOpParamValById)(1, param_vals);
    return 'slope' + pic_shift + "/" + end_shift;
};
const sizeCheck = () => {
    return true;
};
exports.slope = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=slope.js.map