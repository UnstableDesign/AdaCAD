"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overlay_multiple = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "overlay_multiple";
const meta = {
    displayname: 'overlay multiple',
    desc: 'This function will take the lifted heddles within each draft and combine them to make a composite draft whereby each draft can be understood to be overlaid upon each other. The resulting draft size is recalculated in order to ensure equal repeats',
    img: 'overlay_multiple.png',
    categories: [categories_1.compoundOp],
    advanced: true
};
//PARAMS
const params = [];
//INLETS
const drafts = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'all the drafts you would like to overlay another onto',
    num_drafts: -1
};
const inlets = [drafts];
const perform = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return Promise.resolve([]);
    const sys_seq = new sequence_1.Sequence.OneD([0]);
    const composite = new sequence_1.Sequence.TwoD().setBlank(2);
    const ends = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout);
    const pics = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout);
    drafts.forEach((draft) => {
        const seq = new sequence_1.Sequence.TwoD().import(draft.drawdown);
        seq.mapToSystems([0], [0], sys_seq, sys_seq, ends, pics);
        composite.overlay(seq, true);
    });
    let d = (0, draft_1.initDraftFromDrawdown)(composite.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, drafts[0]);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, drafts[0]);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'overlay_multi' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (op_settings, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return true;
    const ends = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout);
    const pics = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout);
    return (ends * pics <= utils_1.defaults.max_area) ? true : false;
};
exports.overlay_multiple = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=overlay_multiple.js.map