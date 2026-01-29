"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stretch = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "stretch";
const meta = {
    displayname: 'stretch',
    desc: 'Repeats each warp and/or weft by the values given in the parameters.',
    img: 'stretch.png',
    categories: [categories_1.transformationOp],
    advanced: true
};
//PARAMS
const warp_repeats = {
    name: 'warp-repeats',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'number of times to repeat each warp end'
};
const weft_repeats = {
    name: 'weft-repeats',
    type: 'number',
    min: 1,
    max: 5000,
    value: 2,
    dx: 'number of times to repeat each weft pic'
};
const params = [warp_repeats, weft_repeats];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to stretch',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    const warp_rep = (0, operations_1.getOpParamValById)(0, op_params);
    const weft_rep = (0, operations_1.getOpParamValById)(1, op_params);
    const weft_mats = new sequence_1.Sequence.OneD();
    const weft_sys = new sequence_1.Sequence.OneD();
    const warp_mats = new sequence_1.Sequence.OneD();
    const warp_sys = new sequence_1.Sequence.OneD();
    const pattern = new sequence_1.Sequence.TwoD();
    input_draft.drawdown.forEach((row, i) => {
        const seq = new sequence_1.Sequence.OneD();
        row.forEach((cell, j) => {
            seq.pushMultiple((0, draft_1.cellToSequenceVal)(cell), warp_rep);
            if (i == 0) {
                for (let r = 0; r < warp_rep; r++) {
                    warp_mats.push(input_draft.colShuttleMapping[j]);
                    warp_sys.push(input_draft.colSystemMapping[j]);
                }
            }
        });
        for (let r = 0; r < weft_rep; r++) {
            weft_mats.push(input_draft.rowShuttleMapping[i]);
            weft_sys.push(input_draft.rowSystemMapping[i]);
            pattern.pushWeftSequence(seq.val());
        }
    });
    const d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_sys.val();
    d.rowShuttleMapping = weft_mats.val();
    d.rowSystemMapping = weft_sys.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'stretch(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return true;
    const warp_rep = (0, operations_1.getOpParamValById)(0, op_params);
    const weft_rep = (0, operations_1.getOpParamValById)(1, op_params);
    const width = (0, draft_1.warps)(input_draft.drawdown) * warp_rep;
    const height = (0, draft_1.wefts)(input_draft.drawdown) * weft_rep;
    return (width * height <= utils_1.defaults.max_area) ? true : false;
};
exports.stretch = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=stretch.js.map