"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shift = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "shift";
const meta = {
    displayname: 'shift',
    desc: 'Generates an output that is shifted to the left and top by the number of warp ends and weft pics specified in the parameters.',
    img: 'shift.png',
    categories: [categories_1.transformationOp]
};
//PARAMS
const amt_x = {
    name: 'warps',
    type: 'number',
    min: -100,
    max: 5000,
    value: 1,
    dx: 'the amount of warps to shift by'
};
const amt_y = {
    name: 'wefts',
    type: 'number',
    min: -100,
    max: 5000,
    value: 1,
    dx: 'the amount of wefts to shift by'
};
const params = [amt_x, amt_y];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    dx: 'the draft to shift',
    uses: "draft",
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    const amt_x = (0, operations_1.getOpParamValById)(0, op_params);
    const amt_y = (0, operations_1.getOpParamValById)(1, op_params);
    if (input_draft == null)
        return Promise.resolve([]);
    const warp_systems = new sequence_1.Sequence.OneD(input_draft.colSystemMapping).shift(-amt_x);
    const warp_mats = new sequence_1.Sequence.OneD(input_draft.colShuttleMapping).shift(-amt_x);
    const weft_systems = new sequence_1.Sequence.OneD(input_draft.rowSystemMapping).shift(-amt_y);
    const weft_materials = new sequence_1.Sequence.OneD(input_draft.rowShuttleMapping).shift(-amt_y);
    const pattern = new sequence_1.Sequence.TwoD();
    input_draft.drawdown.forEach(row => {
        const seq = new sequence_1.Sequence.OneD().import(row).shift(-amt_x).val();
        pattern.pushWeftSequence(seq);
    });
    const next_pattern = new sequence_1.Sequence.TwoD();
    for (let j = 0; j < (0, draft_1.warps)(input_draft.drawdown); j++) {
        const col = pattern.getWarp(j);
        const seq = new sequence_1.Sequence.OneD().import(col).shift(-amt_y);
        next_pattern.pushWarpSequence(seq.val());
    }
    const d = (0, draft_1.initDraftFromDrawdown)(next_pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const amt_x = (0, operations_1.getOpParamValById)(0, param_vals);
    const amt_y = (0, operations_1.getOpParamValById)(1, param_vals);
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'shift' + amt_x + '/' + amt_y + '(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.shift = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=shift.js.map