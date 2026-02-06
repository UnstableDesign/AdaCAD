"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trim = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "trim";
const meta = {
    displayname: 'trim',
    desc: 'Trims off the edges of an input draft according to the parameters described below.',
    img: 'trim.png',
    categories: [categories_1.transformationOp],
    advanced: true
};
//PARAMS
const starting_ends = {
    name: 'ends from start',
    type: 'number',
    min: 0,
    max: 10000,
    value: 1,
    dx: 'number of pics from the origin to start to remove'
};
const staring_pics = {
    name: 'pics from start',
    min: 0,
    max: 10000,
    value: 1,
    type: 'number',
    dx: 'number of ends from the origin to start to remove'
};
const ending_ends = {
    name: 'ends from the end',
    type: 'number',
    min: 0,
    max: 10000,
    value: 1,
    dx: 'number of ends from the opposite edge of the origin to remove'
};
const ending_pics = {
    name: 'pics from the end',
    type: 'number',
    min: 0,
    max: 10000,
    value: 1,
    dx: 'number of pics from the opposite edge of the origin to remove'
};
const params = [starting_ends, staring_pics, ending_ends, ending_pics];
//INLETS
const draft = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to trim',
    num_drafts: 1
};
const inlets = [draft];
const perform = (op_params, op_inputs) => {
    const draft = (0, operations_1.getInputDraft)(op_inputs);
    const left = (0, operations_1.getOpParamValById)(0, op_params);
    const top = (0, operations_1.getOpParamValById)(1, op_params);
    const right = (0, operations_1.getOpParamValById)(2, op_params);
    const bottom = (0, operations_1.getOpParamValById)(3, op_params);
    if (draft == null)
        return Promise.resolve([]);
    const warp_systems = new sequence_1.Sequence.OneD();
    const warp_mats = new sequence_1.Sequence.OneD();
    const weft_systems = new sequence_1.Sequence.OneD();
    const weft_materials = new sequence_1.Sequence.OneD();
    const pattern = new sequence_1.Sequence.TwoD();
    //start with starting pics
    for (let i = top; i < (0, draft_1.wefts)(draft.drawdown) - bottom; i++) {
        const seq = new sequence_1.Sequence.OneD();
        for (let j = left; j < (0, draft_1.warps)(draft.drawdown) - right; j++) {
            seq.push((0, draft_1.getHeddle)(draft.drawdown, i, j));
        }
        pattern.pushWeftSequence(seq.val());
        weft_materials.push(draft.rowShuttleMapping[i]);
        weft_systems.push(draft.rowSystemMapping[i]);
    }
    for (let j = left; j < (0, draft_1.warps)(draft.drawdown) - right; j++) {
        warp_mats.push(draft.colShuttleMapping[j]);
        warp_systems.push(draft.colSystemMapping[j]);
    }
    const d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const r = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(r);
    return 'trim(' + name_list + ")";
};
const sizeCheck = () => {
    return true;
};
exports.trim = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=trim.js.map