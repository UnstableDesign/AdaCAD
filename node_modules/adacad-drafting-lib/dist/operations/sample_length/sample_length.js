"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sample_length = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "sample_length";
const dynamic_param_id = 0;
const dynamic_param_type = 'profile';
const meta = {
    displayname: 'variable length sampler',
    desc: 'Given a series of letters and numbers (a100 b200 c300), this operation will associate a draft with each letter, and then arrange those drafts from top to bottom following the pattern order. The numbers next to each letter describe the number of pics upon which the specified pattern should be repeated',
    img: 'sample_length.png',
    categories: [categories_1.clothOp],
    advanced: true
};
//PARAMS
const pattern = {
    name: 'pattern',
    type: 'string',
    value: 'a20 b20 a40 b40',
    regex: /(?:[a-zA-Z][\d]*[ ]*).*?/, //NEVER USE THE GLOBAL FLAG - it will throw errors randomly
    error: 'invalid entry',
    dx: 'all entries must be a single letter followed by a number, which each letter-number unit separated by a space'
};
const params = [pattern];
//INLETS
const systems = {
    name: 'warp pattern',
    type: 'static',
    value: null,
    uses: "warp-data",
    dx: 'optional, define a custom weft material or system pattern here',
    num_drafts: 1
};
const inlets = [systems];
const perform = (op_params, op_inputs) => {
    const original_string = (0, operations_1.getOpParamValById)(0, op_params);
    const system_data = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const original_string_split = (0, utils_1.parseRegex)(original_string, op_params[0].param.regex);
    if (original_string_split == null || original_string_split.length == 0)
        return Promise.resolve([]);
    if (op_inputs.length == 0)
        return Promise.resolve([]);
    //now just get all the drafts
    const all_drafts = op_inputs
        .filter(el => el.inlet_id > 0)
        .reduce((acc, el) => {
        el.drafts.forEach(draft => { acc.push(draft); });
        return acc;
    }, []);
    let total_warps = 0;
    const all_warps = all_drafts.map(el => (0, draft_1.warps)(el.drawdown)).filter(el => el > 0);
    total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    const profile_draft_map = op_inputs
        .map(el => {
        return {
            id: el.inlet_id,
            val: (el.inlet_params[0] ? el.inlet_params[0].toString() : ""),
            draft: el.drafts[0]
        };
    });
    const pattern = new sequence_1.Sequence.TwoD();
    const warp_systems = new sequence_1.Sequence.OneD();
    const warp_mats = new sequence_1.Sequence.OneD();
    const weft_systems = new sequence_1.Sequence.OneD();
    const weft_materials = new sequence_1.Sequence.OneD();
    if (system_data.length == 0) {
        warp_systems.import(all_drafts[0].colSystemMapping).resize(total_warps);
        warp_mats.import(all_drafts[0].colShuttleMapping).resize(total_warps);
    }
    else {
        warp_systems.import(system_data[0].colSystemMapping).resize(total_warps);
        warp_mats.import(system_data[0].colShuttleMapping).resize(total_warps);
    }
    original_string_split.forEach(string_id => {
        const label = string_id.charAt(0);
        const qty = parseInt(string_id.substring(1));
        const pdm_item = profile_draft_map.find(el => el.val == label.toString());
        if (pdm_item !== undefined) {
            const draft = pdm_item.draft;
            for (let i = 0; i < qty; i++) {
                const row = draft.drawdown[i % (0, draft_1.wefts)(draft.drawdown)];
                const seq = new sequence_1.Sequence.OneD().import(row).resize(total_warps);
                pattern.pushWeftSequence(seq.val());
                weft_materials.push(draft.rowShuttleMapping[i % draft.rowShuttleMapping.length]);
                weft_systems.push(draft.rowSystemMapping[i % draft.rowSystemMapping.length]);
            }
        }
    });
    const d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals) => {
    return 'sample across length:' + param_vals[0].val + "";
};
const onParamChange = (param_vals, static_inlets, inlet_vals, changed_param_id, dynamic_param_val) => {
    const param_val = dynamic_param_val;
    inlet_vals = (0, operations_1.reduceToStaticInputs)(inlets, inlet_vals);
    const param_regex = param_vals[0].param.regex;
    let matches = [];
    matches = (0, utils_1.parseRegex)(param_val, param_regex);
    matches = matches.map(el => el.charAt(0));
    matches = (0, utils_1.filterToUniqueValues)(matches);
    matches.forEach(el => {
        inlet_vals.push(el);
    });
    return inlet_vals;
};
const sizeCheck = (op_params, op_inputs) => {
    const original_string = (0, operations_1.getOpParamValById)(0, op_params);
    const original_string_split = (0, utils_1.parseRegex)(original_string, op_params[0].param.regex);
    if (original_string_split == null || original_string_split.length == 0)
        return true;
    if (op_inputs.length == 0)
        return true;
    //now just get all the drafts
    const all_drafts = op_inputs
        .filter(el => el.inlet_id > 0)
        .reduce((acc, el) => {
        el.drafts.forEach(draft => { acc.push(draft); });
        return acc;
    }, []);
    let total_warps = 0;
    const all_warps = all_drafts.map(el => (0, draft_1.warps)(el.drawdown)).filter(el => el > 0);
    total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    let total_wefts = 0;
    original_string_split.forEach(string_id => {
        const qty = parseInt(string_id.substring(1));
        total_wefts += qty;
    });
    return (total_warps * total_wefts <= utils_1.defaults.max_area) ? true : false;
};
exports.sample_length = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange, sizeCheck };
//# sourceMappingURL=sample_length.js.map