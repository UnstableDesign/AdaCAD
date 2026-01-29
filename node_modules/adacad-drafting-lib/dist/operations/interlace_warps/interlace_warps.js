"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interlace_warps = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "interlace_warps";
const meta = {
    displayname: 'interlace warps',
    desc: 'Creates a new draft by taking one end from each input and assigning and sequencing between those ends in the output draft.',
    img: 'interlacewarps.png',
    categories: [categories_1.compoundOp],
    advanced: true,
    old_names: ['interlacewarps']
};
//PARAMS
const repeats = {
    name: 'calculate repeats',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: "controls if the inputs are intelaced in the exact format sumitted or repeated to fill evenly"
};
const params = [repeats];
//INLETS
const draft_inlet = {
    name: 'drafts',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'all the drafts you would like to interlace',
    num_drafts: -1
};
const weft_systems = {
    name: 'weft system map',
    type: 'static',
    value: null,
    uses: "weft-data",
    dx: 'if you would like to specify the weft system or materials, you can do so by adding a draft here',
    num_drafts: 1
};
const inlets = [draft_inlet, weft_systems];
const perform = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const systems = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const repeat = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return Promise.resolve([]);
    const total_warps = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    let total_wefts;
    if (repeat) {
        total_wefts = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout);
    }
    else {
        total_wefts = (0, utils_1.getMaxWefts)(drafts);
    }
    const pattern = new sequence_1.Sequence.TwoD();
    const warp_systems = [];
    const warp_shuttles = [];
    for (let j = 0; j < total_warps; j++) {
        const selected_draft_id = j % drafts.length;
        const within_draft_j = Math.floor(j / drafts.length);
        const selected_draft = drafts[selected_draft_id];
        if (repeat || within_draft_j < (0, draft_1.warps)(selected_draft.drawdown)) {
            const selected_draft = drafts[selected_draft_id];
            const modulated_id = within_draft_j % (0, draft_1.warps)(selected_draft.drawdown);
            const col = new sequence_1.Sequence.OneD().import((0, draft_1.getCol)(selected_draft.drawdown, modulated_id));
            if (repeat)
                col.resize(total_wefts);
            else
                col.padTo(total_wefts);
            pattern.pushWarpSequence(col.val());
            warp_systems.push(selected_draft.colSystemMapping[modulated_id]);
            warp_shuttles.push(selected_draft.colShuttleMapping[modulated_id]);
        }
    }
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.colShuttleMapping = warp_shuttles;
    d.colSystemMapping = warp_systems;
    if (systems.length > 0)
        d = (0, draft_1.updateWeftSystemsAndShuttles)(d, systems[0]);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "interlace warps(" + name_list + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const repeat = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return true;
    const total_warps = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    let total_wefts;
    if (repeat) {
        total_wefts = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout);
    }
    else {
        total_wefts = (0, utils_1.getMaxWefts)(drafts);
    }
    return (total_warps * total_wefts <= utils_1.defaults.max_area) ? true : false;
};
exports.interlace_warps = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=interlace_warps.js.map