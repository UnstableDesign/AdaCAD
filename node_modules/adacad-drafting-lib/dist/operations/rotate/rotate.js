"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotate = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "rotate";
const meta = {
    displayname: 'rotate',
    desc: 'Generates an output draft that is the same as the input draft, but rotated by the amount specified. ',
    img: 'rotate.png',
    categories: [categories_1.transformationOp],
};
//PARAMS
const amt = {
    name: 'amount',
    type: 'select',
    selectlist: [
        { name: '90', value: 0 },
        { name: '180', value: 1 },
        { name: '270', value: 2 },
    ],
    value: 0,
    dx: 'corner to which this draft is rotated around 0 is top left, 1 top right, 2 bottom right, 3 bottom left'
};
const rotate_materials = {
    name: 'materials?',
    type: 'boolean',
    falsestate: 'no, don\'t rotate materials',
    truestate: 'yes, rotate materials',
    value: 1,
    dx: 'if your draft has materials assigned, you can choose wether you want to rotate the draft or the materials only'
};
const params = [amt, rotate_materials];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to rotate',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const draft = (0, operations_1.getInputDraft)(op_inputs);
    const num_rots = (0, operations_1.getOpParamValById)(0, op_params);
    const rotate_mats = ((0, operations_1.getOpParamValById)(1, op_params) === 0) ? false : true;
    if (draft == null)
        return Promise.resolve([]);
    const seq = new sequence_1.Sequence.TwoD();
    switch (num_rots) {
        case 0:
            draft.drawdown.forEach((row) => {
                const r = new sequence_1.Sequence.OneD().import(row).reverse();
                seq.pushWarpSequence(r.val());
            });
            break;
        case 1:
            draft.drawdown.forEach((row) => {
                const r = new sequence_1.Sequence.OneD().import(row).reverse();
                seq.unshiftWeftSequence(r.val());
            });
            break;
        case 2:
            draft.drawdown.forEach((row) => {
                const r = new sequence_1.Sequence.OneD().import(row);
                seq.unshiftWarpSequence(r.val());
            });
            break;
    }
    const weft_materials = new sequence_1.Sequence.OneD().import(draft.rowShuttleMapping);
    const weft_systems = new sequence_1.Sequence.OneD().import(draft.rowSystemMapping);
    const warp_materials = new sequence_1.Sequence.OneD().import(draft.colShuttleMapping);
    const warp_systems = new sequence_1.Sequence.OneD().import(draft.colSystemMapping);
    const d = (0, draft_1.initDraftFromDrawdown)(seq.export());
    if (rotate_mats) {
        switch (num_rots) {
            case 0:
                d.rowShuttleMapping = warp_materials.reverse().val();
                d.rowSystemMapping = warp_systems.reverse().val();
                d.colShuttleMapping = weft_materials.val();
                d.colSystemMapping = weft_systems.val();
                break;
            case 1:
                d.rowShuttleMapping = weft_materials.reverse().val();
                d.rowSystemMapping = weft_systems.reverse().val();
                d.colShuttleMapping = warp_materials.reverse().val();
                d.colSystemMapping = warp_systems.reverse().val();
                break;
            case 2:
                d.rowShuttleMapping = warp_materials.val();
                d.rowSystemMapping = warp_systems.val();
                d.colShuttleMapping = weft_materials.reverse().val();
                d.colSystemMapping = weft_systems.reverse().val();
                break;
        }
    }
    else {
        d.rowShuttleMapping = weft_materials.resize((0, draft_1.wefts)(d.drawdown)).val();
        d.rowSystemMapping = weft_systems.resize((0, draft_1.wefts)(d.drawdown)).val();
        d.colShuttleMapping = warp_materials.resize((0, draft_1.warps)(d.drawdown)).val();
        d.colSystemMapping = warp_systems.resize((0, draft_1.warps)(d.drawdown)).val();
    }
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'rotate(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.rotate = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=rotate.js.map