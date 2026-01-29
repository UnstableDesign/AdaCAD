"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selvedge = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "selvedge";
const meta = {
    displayname: 'selvedge',
    desc: "Adds a selvedge of so many ends on both sides of the input draft, 'draft.' The second input, 'selvedge,' determines the selvedge pattern, and if none is given, a selvedge is generated.",
    img: 'selvedge.png',
    categories: [categories_1.helperOp],
    advanced: true
};
//PARAMS
const ends = {
    name: 'ends',
    type: 'number',
    min: 1,
    max: 5000,
    value: 12,
    dx: "the number of ends of selvedge on each side of the cloth"
};
const right_shift = {
    name: 'right shift',
    type: 'number',
    min: 0,
    max: 5000,
    value: 0,
    dx: "the number of pics to shift the right side by to ensure the ends catch"
};
const params = [ends, right_shift];
//INLETS
const draft = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: "the draft that will have a selvedge added",
    num_drafts: 1
};
const selvedge_draft = {
    name: 'selvedge',
    type: 'static',
    value: null,
    dx: "the pattern to use for the selvedge",
    uses: "draft",
    num_drafts: 1
};
const inlets = [draft, selvedge_draft];
const perform = (op_params, op_inputs) => {
    const draft = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const sel = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const w = (0, operations_1.getOpParamValById)(0, op_params);
    const shift = (0, operations_1.getOpParamValById)(1, op_params);
    if (draft.length == 0 && sel.length == 0)
        return Promise.resolve([]);
    if (draft.length == 0)
        return Promise.resolve([{ draft: sel[0] }]);
    if (sel.length == 0)
        return Promise.resolve([{ draft: draft[0] }]);
    const complete = new sequence_1.Sequence.TwoD();
    const active_draft = draft[0];
    const sel_draft = sel[0];
    const sel_draft_warps = (0, draft_1.warps)(sel_draft.drawdown);
    const sel_draft_wefts = (0, draft_1.wefts)(sel_draft.drawdown);
    const warp_systems = [];
    const warp_materials = [];
    active_draft.drawdown.forEach((row, i) => {
        const row_seq = new sequence_1.Sequence.OneD();
        for (let j = 0; j < w; j++) {
            row_seq.push((0, draft_1.getHeddle)(sel_draft.drawdown, i % sel_draft_wefts, j % sel_draft_warps));
            if (i == 0)
                warp_materials.push(sel_draft.colShuttleMapping[j % sel_draft_warps]);
            if (i == 0)
                warp_systems.push(sel_draft.colSystemMapping[j % sel_draft_warps]);
        }
        for (let j = 0; j < row.length; j++) {
            row_seq.push((0, draft_1.getHeddle)(active_draft.drawdown, i, j));
            if (i == 0)
                warp_materials.push(active_draft.colShuttleMapping[j]);
            if (i == 0)
                warp_systems.push(active_draft.colSystemMapping[j]);
        }
        for (let j = 0; j < w; j++) {
            row_seq.push((0, draft_1.getHeddle)(sel_draft.drawdown, (i + shift) % sel_draft_wefts, j % sel_draft_warps));
            if (i == 0)
                warp_materials.push(sel_draft.colShuttleMapping[j % sel_draft_warps]);
            if (i == 0)
                warp_systems.push(sel_draft.colSystemMapping[j % sel_draft_warps]);
        }
        complete.pushWeftSequence(row_seq.val());
    });
    let d = (0, draft_1.initDraftFromDrawdown)(complete.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, active_draft);
    d.colShuttleMapping = warp_materials.slice();
    d.colSystemMapping = warp_systems.slice();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const r = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(r);
    return name_list + "+selvedge";
};
const sizeCheck = (op_params, op_inputs) => {
    const draft = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const w = (0, operations_1.getOpParamValById)(0, op_params);
    if (draft.length == 0)
        return w * 2 <= utils_1.defaults.max_area ? true : false;
    const width = (0, draft_1.warps)(draft[0].drawdown) + w * 2;
    const height = (0, draft_1.wefts)(draft[0].drawdown);
    return width * height <= utils_1.defaults.max_area ? true : false;
};
exports.selvedge = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=selvedge.js.map