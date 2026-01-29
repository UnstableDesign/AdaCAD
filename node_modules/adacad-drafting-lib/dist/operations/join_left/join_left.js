"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.join_left = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "join_left";
const meta = {
    displayname: 'join left',
    desc: 'Joins drafts assigned to the drafts input together horizontally.',
    img: 'join_left.png',
    categories: [categories_1.clothOp],
    old_names: ['join left']
};
//PARAMS
const repeats = {
    name: 'calculate repeats',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: "controls if the inputs are repeated along the height so they repeat in even intervals"
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
const weft_data = {
    name: 'weft pattern',
    type: 'static',
    value: null,
    uses: "weft-data",
    dx: 'optional, define a custom weft material or system pattern here',
    num_drafts: 1
};
const inlets = [draft_inlet, weft_data];
const perform = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const weftdata = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const factor_in_repeats = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return Promise.resolve([]);
    let total_wefts = 0;
    const all_wefts = drafts.map(el => (0, draft_1.wefts)(el.drawdown)).filter(el => el > 0);
    if (factor_in_repeats === 1)
        total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    else
        total_wefts = (0, utils_1.getMaxWefts)(drafts);
    const pattern = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < total_wefts; i++) {
        const seq = new sequence_1.Sequence.OneD();
        drafts.forEach(draft => {
            for (let j = 0; j < (0, draft_1.warps)(draft.drawdown); j++) {
                if (!factor_in_repeats && i >= (0, draft_1.wefts)(draft.drawdown)) {
                    seq.push(2);
                }
                else {
                    seq.push((0, draft_1.getHeddle)(draft.drawdown, i % (0, draft_1.wefts)(draft.drawdown), j));
                }
            }
        });
        pattern.pushWeftSequence(seq.val());
    }
    const d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    const warp_mats = new sequence_1.Sequence.OneD();
    const warp_sys = new sequence_1.Sequence.OneD();
    drafts.forEach(draft => {
        for (let j = 0; j < (0, draft_1.warps)(draft.drawdown); j++) {
            warp_mats.push(draft.colShuttleMapping[j]);
            warp_sys.push(draft.colSystemMapping[j]);
        }
    });
    d.colShuttleMapping = warp_mats.resize((0, draft_1.warps)(d.drawdown)).val();
    d.colSystemMapping = warp_sys.resize((0, draft_1.warps)(d.drawdown)).val();
    if (weftdata.length > 0) {
        d.rowShuttleMapping = new sequence_1.Sequence.OneD().import(weftdata[0].rowShuttleMapping).resize((0, draft_1.wefts)(d.drawdown)).val();
        d.rowSystemMapping = new sequence_1.Sequence.OneD().import(weftdata[0].rowSystemMapping).resize((0, draft_1.wefts)(d.drawdown)).val();
    }
    else {
        d.rowShuttleMapping = new sequence_1.Sequence.OneD().import(drafts[0].rowShuttleMapping).resize((0, draft_1.wefts)(d.drawdown)).val();
        d.rowSystemMapping = new sequence_1.Sequence.OneD().import(drafts[0].rowSystemMapping).resize((0, draft_1.wefts)(d.drawdown)).val();
    }
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "join left(" + name_list + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const factor_in_repeats = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return true;
    let total_wefts = 0;
    const all_wefts = drafts.map(el => (0, draft_1.wefts)(el.drawdown)).filter(el => el > 0);
    if (factor_in_repeats === 1)
        total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    else
        total_wefts = (0, utils_1.getMaxWefts)(drafts);
    const total_warps = drafts.reduce((acc, draft) => {
        return acc + (0, draft_1.warps)(draft.drawdown);
    }, 0);
    return (total_wefts * total_warps <= utils_1.defaults.max_area) ? true : false;
};
exports.join_left = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=join_left.js.map