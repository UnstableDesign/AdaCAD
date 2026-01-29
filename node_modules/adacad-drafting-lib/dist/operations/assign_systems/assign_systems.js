"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assign_systems = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const defaults_1 = require("../../utils/defaults");
const name = "assign_systems";
const meta = {
    img: "assign_systems.png",
    displayname: "assign draft to systems",
    desc: "Given a user specified pattern for the weft (a b c) and warp systems (1 2 3), this function will create a draft that follows those system patterns and then map the input draft to the system specified. ",
    advanced: true,
    categories: [categories_1.compoundOp],
    old_names: ['assign systems']
};
//PARAMS
const pattern = {
    name: 'assign to system',
    type: 'string',
    value: 'a1',
    regex: /[\S]/i, //Accepts a letter followed by a number, a single letter or a single number
    error: 'invalid entry',
    dx: 'enter the letter or number associated with the weft/warp system to which this draft will be assigned. For example, "a 1" will assign the draft to the cells associated with warp system 1 and weft system a. The entry "a b" will assign the draft to all warps on both wefts a and b.'
};
const params = [pattern];
//INLETS
const systems = {
    name: 'systems draft',
    type: 'static',
    value: null,
    uses: "warp-and-weft-data",
    dx: 'the draft that describes the system ordering we will add input structures within',
    num_drafts: 1
};
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: 'draft',
    dx: "the draft that will be assigned to a given system",
    num_drafts: 1
};
const inlets = [systems, draft_inlet];
const perform = (op_params, op_inputs) => {
    const original_string = (0, operations_1.getOpParamValById)(0, op_params);
    const original_string_split = (0, utils_1.parseRegex)(original_string, pattern.regex);
    if (op_inputs.length == 0)
        return Promise.resolve([]);
    const system_map = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (system_map.length == 0)
        return Promise.resolve([]);
    ;
    const draft = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    if (draft.length == 0)
        return Promise.resolve([]);
    ;
    const weft_system_map = new sequence_1.Sequence.OneD(system_map[0].rowSystemMapping);
    const warp_system_map = new sequence_1.Sequence.OneD(system_map[0].colSystemMapping);
    const weft_shuttle_map = new sequence_1.Sequence.OneD(system_map[0].rowShuttleMapping);
    const warp_shuttle_map = new sequence_1.Sequence.OneD(system_map[0].colShuttleMapping);
    const layer_draft_map = original_string_split.reduce((acc, val) => {
        return {
            wesy: acc.wesy.concat(parseWeftSystem(val)),
            wasy: acc.wasy.concat(parseWarpSystem(val)),
            layer: acc.layer,
            draft: acc.draft
        };
    }, { wesy: [], wasy: [], layer: 1, draft: draft[0] });
    if (layer_draft_map.wesy.length == 0) {
        layer_draft_map.wesy = (0, utils_1.filterToUniqueValues)(system_map[0].colSystemMapping);
    }
    if (layer_draft_map.wasy.length == 0) {
        layer_draft_map.wasy = (0, utils_1.filterToUniqueValues)(system_map[0].rowSystemMapping);
    }
    const ends = (0, draft_1.warps)(draft[0].drawdown) * (0, draft_1.warps)(system_map[0].drawdown);
    const pics = (0, draft_1.wefts)(draft[0].drawdown) * (0, draft_1.wefts)(system_map[0].drawdown);
    const seq = new sequence_1.Sequence.TwoD().import(layer_draft_map.draft.drawdown);
    seq.mapToSystems(layer_draft_map.wesy, layer_draft_map.wasy, weft_system_map, warp_system_map, ends, pics);
    const d = (0, draft_1.initDraftFromDrawdown)(seq.export());
    d.colSystemMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, warp_system_map.val(), 'col');
    d.rowSystemMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, weft_system_map.val(), 'row');
    d.colShuttleMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, warp_shuttle_map.val(), 'col');
    d.rowShuttleMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, weft_shuttle_map.val(), 'row');
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "assign systems(" + name_list + ")";
};
//pull out all the nubmers from a notation element into warp systems
const parseWarpSystem = (val) => {
    const matches = val.match(/\d+/g);
    if (matches == null || matches.length == 0) {
        console.error("in Layer Notation, no warp system");
        return [];
    }
    return matches.map(el => parseInt(el) - 1);
};
//pull out all the letters from a notation element into weft systems
const parseWeftSystem = (val) => {
    const matches = val.match(/[a-zA-Z]+/g);
    if (matches == null || matches.length == 0) {
        console.error("in Layer Notation, no weft system");
        return [];
    }
    return matches.map(match => match.charCodeAt(0) - 97);
};
const sizeCheck = (op_settings, op_inputs) => {
    const system_map = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (system_map.length == 0)
        return true;
    const draft = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    if (draft.length == 0)
        return true;
    const ends = (0, draft_1.warps)(draft[0].drawdown) * (0, draft_1.warps)(system_map[0].drawdown);
    const pics = (0, draft_1.wefts)(draft[0].drawdown) * (0, draft_1.wefts)(system_map[0].drawdown);
    return (ends * pics) <= defaults_1.defaults.max_area ? true : false;
};
exports.assign_systems = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=assign_systems.js.map