"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interlace = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "interlace";
const meta = {
    displayname: 'interlace wefts',
    desc: 'Creates a new draft by taking one pic from each input draft and assigning them to successive pics in the output draft.',
    img: 'interlace.png',
    advanced: true,
    categories: [categories_1.compoundOp]
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
const warp_systems = {
    name: 'warp system map',
    type: 'static',
    value: null,
    uses: "warp-data",
    dx: 'if you would like to specify the warp system or materials, you can do so by adding a draft here',
    num_drafts: 1
};
const inlets = [draft_inlet, warp_systems];
const perform = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const systems = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const repeat = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return Promise.resolve([]);
    const total_wefts = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    const make_unique = drafts.reduce((acc, draft) => {
        const sized = new sequence_1.Sequence.OneD().import(draft.rowSystemMapping).resize(total_wefts).val();
        acc.push(sized);
        return acc;
    }, []);
    const unique = (0, draft_1.makeSystemsUnique)(make_unique);
    let total_warps;
    if (repeat) {
        total_warps = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout);
    }
    else {
        total_warps = (0, utils_1.getMaxWarps)(drafts);
    }
    const pattern = new sequence_1.Sequence.TwoD();
    const weft_systems = [];
    const weft_shuttles = [];
    for (let i = 0; i < total_wefts; i++) {
        const selected_draft_id = i % drafts.length;
        const within_draft_i = Math.floor(i / drafts.length);
        const selected_draft = drafts[selected_draft_id];
        if (repeat || within_draft_i < (0, draft_1.wefts)(selected_draft.drawdown)) {
            const selected_draft = drafts[selected_draft_id];
            const modulated_id = within_draft_i % (0, draft_1.wefts)(selected_draft.drawdown);
            const row = new sequence_1.Sequence.OneD().import(selected_draft.drawdown[modulated_id]);
            if (repeat)
                row.resize(total_warps);
            else
                row.padTo(total_warps);
            pattern.pushWeftSequence(row.val());
            weft_systems.push(unique[selected_draft_id][within_draft_i]);
            weft_shuttles.push(selected_draft.rowShuttleMapping[modulated_id]);
        }
    }
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.rowShuttleMapping = weft_shuttles;
    d.rowSystemMapping = weft_systems;
    if (systems.length > 0)
        d = (0, draft_1.updateWarpSystemsAndShuttles)(d, systems[0]);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "interlace(" + name_list + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const repeat = (0, operations_1.getOpParamValById)(0, op_params);
    if (drafts.length == 0)
        return true;
    const total_wefts = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    let total_warps;
    if (repeat) {
        total_warps = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout);
    }
    else {
        total_warps = (0, utils_1.getMaxWarps)(drafts);
    }
    return (total_wefts * total_warps <= utils_1.defaults.max_area) ? true : false;
};
exports.interlace = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=interlace.js.map