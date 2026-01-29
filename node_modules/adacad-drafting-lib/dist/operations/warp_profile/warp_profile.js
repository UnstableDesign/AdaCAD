"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warp_profile = void 0;
const sequence_1 = require("../../sequence/sequence");
const draft_1 = require("../../draft");
const utils_1 = require("../../utils");
const operations_1 = require("../operations");
const categories_1 = require("../categories");
const name = "warp_profile";
const meta = {
    displayname: 'pattern across width',
    desc: 'Given a series of letters (a b c, etc), this operation will associate a draft with each letter, and then arrange those drafts from left to right following the pattern order',
    img: 'warp_profile.png',
    categories: [categories_1.clothOp],
    old_names: ["dynamicjoinleft"],
    advanced: true
};
const dynamic_param_id = 0;
const dynamic_param_type = 'profile';
//PARAMS
const pattern = {
    name: 'pattern',
    type: 'string',
    value: 'a b c a b c',
    regex: /\S+/,
    error: 'invalid entry',
    dx: 'all entries must be letters separated by a space'
};
const params = [pattern];
//INLETS
const systems = {
    name: 'weft pattern',
    type: 'static',
    value: null,
    uses: "weft-data",
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
    let total_wefts = 0;
    const all_wefts = all_drafts.map(el => (0, draft_1.wefts)(el.drawdown)).filter(el => el > 0);
    total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    const profile_draft_map = op_inputs
        .map(el => {
        return {
            id: el.inlet_id,
            val: (el.inlet_params[0] == undefined) ? '' : (el.inlet_params[0]).toString(),
            draft: el.drafts[0]
        };
    });
    const pattern = new sequence_1.Sequence.TwoD();
    const warp_systems = new sequence_1.Sequence.OneD();
    const warp_mats = new sequence_1.Sequence.OneD();
    const weft_systems = new sequence_1.Sequence.OneD();
    const weft_materials = new sequence_1.Sequence.OneD();
    if (system_data.length == 0) {
        weft_systems.import(all_drafts[0].rowSystemMapping).resize(total_wefts);
        weft_materials.import(all_drafts[0].rowShuttleMapping).resize(total_wefts);
    }
    else {
        weft_systems.import(system_data[0].rowSystemMapping).resize(total_wefts);
        weft_materials.import(system_data[0].rowShuttleMapping).resize(total_wefts);
    }
    original_string_split.forEach(string_id => {
        const pdm_item = profile_draft_map.find(el => el.val == string_id);
        if (pdm_item !== undefined) {
            const draft = pdm_item.draft;
            for (let j = 0; j < (0, draft_1.warps)(draft.drawdown); j++) {
                const col = (0, draft_1.getCol)(draft.drawdown, j);
                const seq = new sequence_1.Sequence.OneD().import(col).resize(total_wefts);
                pattern.pushWarpSequence(seq.val());
                warp_mats.push(draft.colShuttleMapping[j % draft.colShuttleMapping.length]);
                warp_systems.push(draft.colSystemMapping[j % draft.colSystemMapping.length]);
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
    return 'pattern across width:' + param_vals[0].val + "";
};
const onParamChange = (param_vals, static_inlets, inlet_vals, changed_param_id, dynamic_param_val) => {
    const static_inlet_vals = (0, operations_1.reduceToStaticInputs)(inlets, inlet_vals);
    const combined_inlet_vals = static_inlet_vals.slice();
    const param_regex = param_vals[changed_param_id].param.regex;
    let matches = [];
    matches = (0, utils_1.parseRegex)(dynamic_param_val, param_regex);
    matches = (0, utils_1.filterToUniqueValues)(matches);
    matches.forEach((el) => {
        combined_inlet_vals.push(el);
    });
    return combined_inlet_vals;
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
    let total_wefts = 0;
    const all_wefts = all_drafts.map(el => (0, draft_1.wefts)(el.drawdown)).filter(el => el > 0);
    total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    const profile_draft_map = op_inputs
        .map(el => {
        return {
            id: el.inlet_id,
            val: (el.inlet_params[0] == undefined) ? '' : (el.inlet_params[0]).toString(),
            draft: el.drafts[0]
        };
    });
    let total_warps = 0;
    original_string_split.forEach(string_id => {
        const draft_map_item = profile_draft_map.find(el => el.val == string_id);
        if (draft_map_item !== undefined) {
            total_warps += (0, draft_1.warps)(draft_map_item.draft.drawdown);
        }
    });
    return (total_warps * total_wefts <= utils_1.defaults.max_area) ? true : false;
};
exports.warp_profile = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange, sizeCheck };
//# sourceMappingURL=warp_profile.js.map