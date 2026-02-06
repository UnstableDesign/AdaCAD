"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.margin = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "margin";
const meta = {
    displayname: 'add margins',
    desc: 'Encases one structure within another by adding the second structure to the top, left, bottom and/or right of the draft.',
    img: 'margin.png',
    categories: [categories_1.transformationOp],
    advanced: true
};
//PARAMS
const starting_pics = {
    name: 'starting pics',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of pics to add to the bottom of the draft'
};
const ending_pics = {
    name: 'ending pics',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of pics to add to the end of the draft'
};
const starting_ends = {
    name: 'starting ends',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of ends to add to the start of the draft'
};
const ending_ends = {
    name: 'ending ends',
    min: 0,
    max: 10000,
    value: 12,
    type: 'number',
    dx: 'number of ends to add to the end of the draft'
};
const params = [starting_pics, ending_pics, starting_ends, ending_ends];
//INLETS
const draft = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to add margins to',
    num_drafts: 1
};
const selvedge_draft = {
    name: 'margin',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to repeat within the margins',
    num_drafts: 1
};
const inlets = [draft, selvedge_draft];
const perform = (op_params, op_inputs) => {
    const base_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const margin_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const starting_pics = (0, operations_1.getOpParamValById)(0, op_params);
    const ending_pics = (0, operations_1.getOpParamValById)(1, op_params);
    const starting_ends = (0, operations_1.getOpParamValById)(2, op_params);
    const ending_ends = (0, operations_1.getOpParamValById)(3, op_params);
    if (base_drafts.length == 0 && margin_drafts.length == 0)
        return Promise.resolve([]);
    const active_draft = (base_drafts.length > 0) ? base_drafts[0] : (0, draft_1.initDraftWithParams)({ warps: 1, wefts: 1 });
    const margin_draft = (margin_drafts.length > 0) ? margin_drafts[0] : (0, draft_1.initDraftWithParams)({ warps: 1, wefts: 1 });
    const width = (0, draft_1.warps)(active_draft.drawdown) + starting_ends + ending_ends;
    const height = (0, draft_1.wefts)(active_draft.drawdown) + ending_pics + starting_pics;
    const warp_systems = new sequence_1.Sequence.OneD(active_draft.colSystemMapping).resize(width).shift(starting_ends);
    const warp_mats = new sequence_1.Sequence.OneD(active_draft.colShuttleMapping).resize(width).shift(starting_ends);
    const weft_systems = new sequence_1.Sequence.OneD(active_draft.rowSystemMapping).resize(height).shift(starting_pics);
    const weft_materials = new sequence_1.Sequence.OneD(active_draft.rowShuttleMapping).resize(height).shift(starting_pics);
    const pattern = new sequence_1.Sequence.TwoD();
    //start with starting pics
    for (let i = 0; i < height; i++) {
        const seq = new sequence_1.Sequence.OneD();
        if (i < starting_pics) {
            seq.import(margin_draft.drawdown[i % (0, draft_1.wefts)(margin_draft.drawdown)])
                .resize(width);
        }
        else if (i < starting_pics + (0, draft_1.wefts)(active_draft.drawdown)) {
            //adjust the start of the margin draft so it starts at the same index as the original
            const adj_i = i - starting_pics;
            const left_margin = new sequence_1.Sequence.OneD().pushRow(margin_draft.drawdown[i % (0, draft_1.wefts)(margin_draft.drawdown)])
                .resize(starting_ends);
            const center = new sequence_1.Sequence.OneD().pushRow(active_draft.drawdown[adj_i % (0, draft_1.wefts)(active_draft.drawdown)]);
            //shift this so it sequences at the same rate as the other margin rows
            let shift_i = (starting_ends + (0, draft_1.warps)(active_draft.drawdown)) % (0, draft_1.warps)(margin_draft.drawdown);
            shift_i = (0, draft_1.warps)(margin_draft.drawdown) - shift_i;
            const right_margin = new sequence_1.Sequence.OneD().pushRow(margin_draft.drawdown[i % (0, draft_1.wefts)(margin_draft.drawdown)])
                .resize(ending_ends).shift(shift_i);
            seq
                .pushRow(left_margin.val())
                .pushRow(center.val())
                .pushRow(right_margin.val());
        }
        else {
            seq.import(margin_draft.drawdown[i % (0, draft_1.wefts)(margin_draft.drawdown)])
                .resize(width);
        }
        pattern.pushWeftSequence(seq.val());
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
    return name_list + "+margin";
};
const sizeCheck = (op_params, op_inputs) => {
    const base_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const starting_pics = (0, operations_1.getOpParamValById)(0, op_params);
    const ending_pics = (0, operations_1.getOpParamValById)(1, op_params);
    const starting_ends = (0, operations_1.getOpParamValById)(2, op_params);
    const ending_ends = (0, operations_1.getOpParamValById)(3, op_params);
    if (base_drafts.length == 0)
        return true;
    const base_draft = base_drafts[0];
    const width = (0, draft_1.warps)(base_draft.drawdown) + starting_ends + ending_ends;
    const height = (0, draft_1.wefts)(base_draft.drawdown) + ending_pics + starting_pics;
    return (width * height <= utils_1.defaults.max_area) ? true : false;
};
exports.margin = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=margin.js.map