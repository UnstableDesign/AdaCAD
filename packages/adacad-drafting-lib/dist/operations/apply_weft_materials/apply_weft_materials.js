"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply_weft_materials = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const __1 = require("..");
const categories_1 = require("../categories");
const name = "apply_weft_materials";
const meta = {
    displayname: "set weft materials",
    img: 'apply_weft_materials.png',
    desc: "Copies the materials used in the materials draft to the picks of the input draft.",
    categories: [categories_1.colorEffectsOp],
    old_names: ['apply weft materials']
};
//PARAMS
const shift_weft_mats = {
    name: 'weft colors shift',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of pics by which to shift the weft color pattern'
};
const params = [shift_weft_mats];
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
    name: 'materials',
    type: 'static',
    value: null,
    uses: 'weft-data',
    dx: 'a draft which has the materials you would like to repeat across the pics and ends of the resulting draft',
    num_drafts: 1
};
const inlets = [draft, materials];
const perform = (op_params, op_inputs) => {
    const base_drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 0);
    const materials_drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 1);
    const weft_mat_shift = (0, __1.getOpParamValById)(0, op_params);
    if (base_drafts.length == 0 && materials_drafts.length == 0)
        return Promise.resolve([]);
    if (base_drafts.length == 0)
        return Promise.resolve([{ draft: materials_drafts[0] }]);
    if (materials_drafts.length == 0)
        return Promise.resolve([{ draft: base_drafts[0] }]);
    const active_draft = base_drafts[0];
    const materials_draft = materials_drafts[0];
    const height = (0, draft_1.wefts)(active_draft.drawdown);
    const weft_materials = new sequence_1.Sequence.OneD(materials_draft.rowShuttleMapping).resize(height).shift(weft_mat_shift);
    const d = (0, draft_1.copyDraft)(active_draft);
    d.rowShuttleMapping = weft_materials.val();
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
exports.apply_weft_materials = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=apply_weft_materials.js.map