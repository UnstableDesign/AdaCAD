"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply_warp_materials = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const __1 = require("..");
const categories_1 = require("../categories");
const name = "apply_warp_materials";
const meta = {
    displayname: "set warp materials",
    img: "apply_warp_materials.png",
    desc: "Copies the materials used in the materials draft to the ends of the input draft.",
    categories: [categories_1.colorEffectsOp],
    old_names: ['apply warp materials']
};
//PARAMS
const shift_warp_mat = {
    name: 'warp colors shift',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of ends by which to shift the warp color pattern'
};
const params = [shift_warp_mat];
//INLETS
const draft = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: 'the draft to which you would like to apply materials',
    num_drafts: 1
};
const materials = {
    name: 'warp materials',
    type: 'static',
    value: null,
    uses: 'warp-data',
    dx: 'a draft which has the materials you would like to repeat across the ends of the resulting draft',
    num_drafts: 1
};
const inlets = [draft, materials];
const perform = (op_params, op_inputs) => {
    const base_drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 0);
    const materials_drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 1);
    const warp_mat_shift = (0, __1.getOpParamValById)(0, op_params);
    if (base_drafts.length == 0 && materials_drafts.length == 0)
        return Promise.resolve([]);
    if (base_drafts.length == 0)
        return Promise.resolve([{ draft: materials_drafts[0] }]);
    if (materials_drafts.length == 0)
        return Promise.resolve([{ draft: base_drafts[0] }]);
    const active_draft = base_drafts[0];
    const materials_draft = materials_drafts[0];
    const width = (0, draft_1.warps)(active_draft.drawdown);
    const warp_mats = new sequence_1.Sequence.OneD(materials_draft.colShuttleMapping).resize(width).shift(warp_mat_shift);
    const d = (0, draft_1.copyDraft)(active_draft);
    d.colShuttleMapping = warp_mats.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const r = (0, __1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, __1.parseDraftNames)(r);
    return name_list;
};
const sizeCheck = () => {
    return true;
};
exports.apply_warp_materials = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=apply_warp_materials.js.map