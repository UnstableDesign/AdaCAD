"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.join_top = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "join_top";
const meta = {
    displayname: 'join top',
    desc: 'Joins drafts assigned to the inlets vertically.',
    img: 'join_top.png',
    categories: [categories_1.clothOp],
    old_names: ['join top']
};
//PARAMS
const repeats = {
    name: 'calculate repeats',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: "controls if the inputs are repeated along the width so they repeat in even intervals"
};
const params = [repeats];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to join horizontally',
    num_drafts: -1
};
const warp_data = {
    name: 'warp pattern',
    type: 'static',
    value: null,
    uses: "warp-data",
    dx: 'optional, define a custom warp material or system pattern here',
    num_drafts: 1
};
const inlets = [draft_inlet, warp_data];
const perform = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const warpdata = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const factor_in_repeats = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return Promise.resolve([]);
    let total_warps = 0;
    const all_warps = drafts.map(el => (0, draft_1.warps)(el.drawdown)).filter(el => el > 0);
    if (factor_in_repeats === 1)
        total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    else
        total_warps = (0, utils_1.getMaxWarps)(drafts);
    const pattern = new sequence_1.Sequence.TwoD();
    for (let j = 0; j < total_warps; j++) {
        const seq = new sequence_1.Sequence.OneD();
        drafts.forEach(draft => {
            if (!factor_in_repeats && j >= (0, draft_1.warps)(draft.drawdown)) {
                seq.pushMultiple(2, (0, draft_1.wefts)(draft.drawdown));
            }
            else {
                const col = (0, draft_1.getCol)(draft.drawdown, j % (0, draft_1.warps)(draft.drawdown));
                for (let i = 0; i < (0, draft_1.wefts)(draft.drawdown); i++) {
                    seq.push((0, draft_1.getCellValue)(col[i]));
                }
            }
        });
        pattern.pushWarpSequence(seq.val());
    }
    const d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    const weft_mats = new sequence_1.Sequence.OneD();
    const weft_sys = new sequence_1.Sequence.OneD();
    drafts.forEach(draft => {
        for (let i = 0; i < (0, draft_1.wefts)(draft.drawdown); i++) {
            weft_mats.push(draft.rowShuttleMapping[i]);
            weft_sys.push(draft.rowSystemMapping[i]);
        }
    });
    d.rowShuttleMapping = weft_mats.resize((0, draft_1.wefts)(d.drawdown)).val();
    d.rowSystemMapping = weft_sys.resize((0, draft_1.wefts)(d.drawdown)).val();
    if (warpdata.length > 0) {
        d.colShuttleMapping = new sequence_1.Sequence.OneD().import(warpdata[0].colShuttleMapping).resize((0, draft_1.warps)(d.drawdown)).val();
        d.colSystemMapping = new sequence_1.Sequence.OneD().import(warpdata[0].colSystemMapping).resize((0, draft_1.warps)(d.drawdown)).val();
    }
    else {
        d.colShuttleMapping = new sequence_1.Sequence.OneD().import(drafts[0].colShuttleMapping).resize((0, draft_1.warps)(d.drawdown)).val();
        d.colSystemMapping = new sequence_1.Sequence.OneD().import(drafts[0].colSystemMapping).resize((0, draft_1.warps)(d.drawdown)).val();
    }
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "join top(" + name_list + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const factor_in_repeats = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return true;
    let total_warps = 0;
    const all_warps = drafts.map(el => (0, draft_1.warps)(el.drawdown)).filter(el => el > 0);
    if (factor_in_repeats === 1)
        total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    else
        total_warps = (0, utils_1.getMaxWarps)(drafts);
    const total_wefts = drafts.reduce((acc, draft) => {
        return acc + (0, draft_1.wefts)(draft.drawdown);
    }, 0);
    return (total_warps * total_wefts <= utils_1.defaults.max_area) ? true : false;
};
exports.join_top = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=join_top.js.map