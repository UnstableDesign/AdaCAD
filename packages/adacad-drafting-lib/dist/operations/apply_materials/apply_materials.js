"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply_materials = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const __1 = require("..");
const categories_1 = require("../categories");
const name = "apply_materials";
const meta = {
    img: "apply_materials.png",
    displayname: "set materials and systems",
    categories: [categories_1.colorEffectsOp],
    desc: "Adds information to the draft that represents the materials and warp- and weft-systems that will be associated with the draft",
    old_names: ["apply materials"]
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
const shift_weft_mats = {
    name: 'weft colors shift',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of pics by which to shift the weft color pattern'
};
const shift_warp_systems = {
    name: 'warp system shift',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of ends by which to shift the warp system order'
};
const shift_weft_systems = {
    name: 'weft system shift',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of pics by which to shift the weft system order'
};
const params = [shift_warp_mat, shift_weft_mats, shift_warp_systems, shift_weft_systems];
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
    name: 'systems & materials',
    type: 'static',
    value: null,
    uses: 'warp-and-weft-data',
    dx: 'a draft which has the materials and systems you would like to repeat across the pics and ends of the resulting draft',
    num_drafts: 1
};
const inlets = [draft, materials];
const perform = (op_params, op_inputs) => {
    const base_drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 0);
    const materials_drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 1);
    const weft_mat_shift = (0, __1.getOpParamValById)(1, op_params);
    const warp_mat_shift = (0, __1.getOpParamValById)(0, op_params);
    const warp_sys_shift = (0, __1.getOpParamValById)(2, op_params);
    const weft_sys_shift = (0, __1.getOpParamValById)(3, op_params);
    if (base_drafts.length == 0 && materials_drafts.length == 0)
        return Promise.resolve([]);
    if (base_drafts.length == 0)
        return Promise.resolve([{ draft: materials_drafts[0] }]);
    if (materials_drafts.length == 0)
        return Promise.resolve([{ draft: base_drafts[0] }]);
    const active_draft = base_drafts[0];
    const materials_draft = materials_drafts[0];
    const width = (0, draft_1.warps)(active_draft.drawdown);
    const height = (0, draft_1.wefts)(active_draft.drawdown);
    const warp_systems = new sequence_1.Sequence.OneD(materials_draft.colSystemMapping).resize(width).shift(warp_sys_shift);
    const warp_mats = new sequence_1.Sequence.OneD(materials_draft.colShuttleMapping).resize(width).shift(warp_mat_shift);
    const weft_systems = new sequence_1.Sequence.OneD(materials_draft.rowSystemMapping).resize(height).shift(weft_sys_shift);
    const weft_materials = new sequence_1.Sequence.OneD(materials_draft.rowShuttleMapping).resize(height).shift(weft_mat_shift);
    const d = (0, draft_1.copyDraft)(active_draft);
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
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
exports.apply_materials = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=apply_materials.js.map