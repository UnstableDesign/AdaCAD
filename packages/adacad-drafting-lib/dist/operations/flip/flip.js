"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flip = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "flip";
const meta = {
    displayname: 'flip',
    categories: [categories_1.transformationOp],
    desc: 'Generates an output draft that mirrors the input draft from left to right and/or top to bottom as the parameters indicate.',
    img: 'flip.png'
};
//PARAMS
const horiz = {
    name: 'horiz',
    type: 'boolean',
    falsestate: 'no',
    truestate: 'yes',
    value: 0,
    dx: ''
};
const vert = {
    name: 'vert',
    type: 'boolean',
    falsestate: "no",
    truestate: "yes",
    value: 0,
    dx: ''
};
const params = [horiz, vert];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to flip horizontally',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    const weft_systems = new sequence_1.Sequence.OneD(input_draft.rowSystemMapping);
    const weft_materials = new sequence_1.Sequence.OneD(input_draft.rowShuttleMapping);
    const warp_systems = new sequence_1.Sequence.OneD(input_draft.colSystemMapping);
    const warp_mats = new sequence_1.Sequence.OneD(input_draft.colShuttleMapping);
    const pattern = new sequence_1.Sequence.TwoD();
    const horiz = (0, operations_1.getOpParamValById)(0, op_params);
    const vert = (0, operations_1.getOpParamValById)(1, op_params);
    if (horiz) {
        warp_systems.reverse();
        warp_mats.reverse();
        input_draft.drawdown.forEach(row => {
            const seq = new sequence_1.Sequence.OneD().import(row).reverse().val();
            pattern.pushWeftSequence(seq);
        });
    }
    else {
        pattern.import(input_draft.drawdown);
    }
    const next_pattern = new sequence_1.Sequence.TwoD();
    if (vert) {
        weft_systems.reverse();
        weft_materials.reverse();
        for (let j = 0; j < (0, draft_1.warps)(input_draft.drawdown); j++) {
            const col = pattern.getWarp(j);
            const seq = new sequence_1.Sequence.OneD().import(col).reverse();
            next_pattern.pushWarpSequence(seq.val());
        }
    }
    else {
        next_pattern.import(pattern.export());
    }
    const d = (0, draft_1.initDraftFromDrawdown)(next_pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'flip(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.flip = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=flip.js.map