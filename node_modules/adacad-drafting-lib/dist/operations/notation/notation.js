"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notation = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "notation";
const dynamic_param_id = 0;
const dynamic_param_type = 'notation';
const meta = {
    displayname: 'layer notation',
    desc: 'Developed in collaboration with Kathryn Walters, this operation parses a string formatted in layer notation to assign drafts to different warp and weft patterns on different layers of cloth. Layers are represented by () so (1a)(2b) puts warp 1 and weft a on layer 1, warp 2 and weft b on layer 2. You can read in detail about the specific notation used, and how it is interpreted on the  layer notation glossary page.',
    img: 'notation.png',
    categories: [categories_1.compoundOp],
    advanced: true,
    authors: ['Laura Devendorf', 'Kathryn Walters'],
    urls: [{ url: 'https://docs.adacad.org/docs/reference/glossary/layer-notation.md', text: 'Learn more about layer notation' }],
    old_names: ["assignlayers"]
};
//PARAMS
const pattern = {
    name: 'pattern',
    type: 'string',
    value: '(a1)(b2)',
    regex: /\(.*?\)|[\S]/i, //this is the layer parsing regex
    error: 'invalid entry',
    dx: 'the string describes which warps and wefts will be associated with a given layer. Layers are marked with (), so (a1)(b1) places warp system 1 and weft system a on the top layer, and b1 on the bottom. You an then assign drafts to these layers independently. A letter or number between the layers, such as (a1)c(b2) will be interpreted a float between the layers.'
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
const inlets = [systems];
const perform = (op_params, op_inputs) => {
    const original_string = (0, operations_1.getOpParamValById)(0, op_params);
    const original_string_split = (0, utils_1.parseRegex)(original_string, pattern.regex);
    if (original_string_split == null || original_string_split.length == 0)
        return Promise.resolve([]);
    const system_map = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (op_inputs.length == 0)
        return Promise.resolve([]);
    if (system_map.length == 0)
        return Promise.resolve([]);
    ;
    const weft_system_map = new sequence_1.Sequence.OneD(system_map[0].rowSystemMapping);
    const warp_system_map = new sequence_1.Sequence.OneD(system_map[0].colSystemMapping);
    const weft_shuttle_map = new sequence_1.Sequence.OneD(system_map[0].rowShuttleMapping);
    const warp_shuttle_map = new sequence_1.Sequence.OneD(system_map[0].colShuttleMapping);
    //make sure the system draft map has a representation for every layer, even if the draft at that layer is null.
    const layer_draft_map = original_string_split.map((unit) => {
        const drafts = (0, operations_1.getAllDraftsAtInletByLabel)(op_inputs, unit);
        return {
            wesy: parseWeftSystem(unit),
            wasy: parseWarpSystem(unit),
            is_layer: unit.includes("("),
            draft: (drafts == null || drafts.length == 0) ? null : drafts[0]
        };
    });
    //setup the environment for the output draft
    const composite = new sequence_1.Sequence.TwoD().setBlank(2);
    const ends = (0, utils_1.lcm)(layer_draft_map.filter(el => el.draft !== null)
        .map(ldm => (0, draft_1.warps)(ldm.draft.drawdown)), utils_1.defaults.lcm_timeout) * (0, draft_1.warps)(system_map[0].drawdown);
    const pics = (0, utils_1.lcm)(layer_draft_map.filter(el => el.draft !== null)
        .map(ldm => (0, draft_1.wefts)(ldm.draft.drawdown)), utils_1.defaults.lcm_timeout) * (0, draft_1.wefts)(system_map[0].drawdown);
    //assign drafts to their specified systems. 
    let weft_sys_above = [];
    let warp_sys_above = [];
    layer_draft_map.forEach((sdm) => {
        let seq = null;
        if (sdm.is_layer && sdm.draft !== null) {
            seq = new sequence_1.Sequence.TwoD().import(sdm.draft.drawdown);
            seq.mapToSystems(sdm.wesy, sdm.wasy, weft_system_map, warp_system_map, ends, pics);
            composite.overlay(seq, false);
        }
        composite.placeInLayerStack(sdm.wasy, warp_sys_above, sdm.wesy, weft_sys_above, weft_system_map, warp_system_map);
        weft_sys_above = weft_sys_above.concat(sdm.wesy);
        warp_sys_above = warp_sys_above.concat(sdm.wasy);
    });
    const d = (0, draft_1.initDraftFromDrawdown)(composite.export());
    d.colSystemMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, warp_system_map.val(), 'col');
    d.rowSystemMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, weft_system_map.val(), 'row');
    d.colShuttleMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, warp_shuttle_map.val(), 'col');
    d.rowShuttleMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, weft_shuttle_map.val(), 'row');
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals) => {
    return '' + param_vals[0] + "";
};
const onParamChange = (param_vals, static_inlets, inlet_vals, changed_param_id, dynamic_param_val) => {
    inlet_vals = (0, operations_1.reduceToStaticInputs)(inlets, inlet_vals);
    const param_val = dynamic_param_val;
    const param_regex = pattern.regex;
    let matches = [];
    matches = (0, utils_1.parseRegex)(param_val, param_regex);
    //only create inlets for layer groups (not floating warps, wefts)
    matches.forEach(el => {
        if (el.includes('('))
            inlet_vals.push(el);
    });
    return inlet_vals;
};
const sizeCheck = (op_params, op_inputs) => {
    const system_map = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (system_map.length == 0)
        return true;
    const original_string = (0, operations_1.getOpParamValById)(0, op_params);
    const original_string_split = (0, utils_1.parseRegex)(original_string, pattern.regex);
    if (original_string_split == null || original_string_split.length == 0)
        return true;
    const layer_draft_map = original_string_split.map((unit) => {
        const drafts = (0, operations_1.getAllDraftsAtInletByLabel)(op_inputs, unit);
        return {
            draft: (drafts == null || drafts.length == 0) ? null : drafts[0]
        };
    });
    const ends = (0, utils_1.lcm)(layer_draft_map.filter(el => el.draft !== null)
        .map(ldm => (0, draft_1.warps)(ldm.draft.drawdown)), utils_1.defaults.lcm_timeout) * (0, draft_1.warps)(system_map[0].drawdown);
    const pics = (0, utils_1.lcm)(layer_draft_map.filter(el => el.draft !== null)
        .map(ldm => (0, draft_1.wefts)(ldm.draft.drawdown)), utils_1.defaults.lcm_timeout) * (0, draft_1.wefts)(system_map[0].drawdown);
    return ends * pics <= utils_1.defaults.max_area ? true : false;
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
exports.notation = { name, meta, params, inlets, dynamic_param_id, dynamic_param_type, perform, generateName, onParamChange, sizeCheck };
//# sourceMappingURL=notation.js.map