"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layer = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "layer";
const meta = {
    displayname: 'layer',
    desc: 'Creates a draft in which each input is assigned to a layer in a multilayered structure. Assigns the first input to the top layer and so on.',
    img: 'layer.png',
    categories: [categories_1.compoundOp],
    advanced: true
};
//PARAMS
const params = [];
//INLETS
const draft_inlet = {
    name: 'drafts',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the drafts to layer (from top to bottom)',
    num_drafts: -1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return Promise.resolve([]);
    //create a default system mapping that assumes alternating weft and warp systems associated with each layer
    const sys_seq = new sequence_1.Sequence.OneD();
    for (let i = 0; i < drafts.length; i++) {
        sys_seq.push(i);
    }
    const composite = new sequence_1.Sequence.TwoD().setBlank(2);
    const ends = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    const pics = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    const warp_sys_above = [];
    const weft_sys_above = [];
    drafts.forEach((draft, ndx) => {
        const seq = new sequence_1.Sequence.TwoD().import(draft.drawdown);
        seq.mapToSystems([ndx], [ndx], sys_seq, sys_seq, ends, pics);
        composite.overlay(seq, false);
        composite.placeInLayerStack([ndx], warp_sys_above, [ndx], weft_sys_above, sys_seq, sys_seq);
        warp_sys_above.push(ndx);
        weft_sys_above.push(ndx);
    });
    const d = (0, draft_1.initDraftFromDrawdown)(composite.export());
    d.colSystemMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, sys_seq.val(), 'col');
    d.rowSystemMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, sys_seq.val(), 'row');
    const warp_mats = [];
    for (let j = 0; j < ends; j++) {
        const select_draft = j % drafts.length;
        const within_draft_id = Math.floor(j / drafts.length);
        const mat_mapping = drafts[select_draft].colShuttleMapping;
        const mat_id = mat_mapping[within_draft_id % mat_mapping.length];
        warp_mats.push(mat_id);
    }
    const weft_mats = [];
    for (let i = 0; i < pics; i++) {
        const select_draft = i % drafts.length;
        const within_draft_id = Math.floor(i / drafts.length);
        const mat_mapping = drafts[select_draft].rowShuttleMapping;
        const mat_id = mat_mapping[within_draft_id % mat_mapping.length];
        weft_mats.push(mat_id);
    }
    d.rowShuttleMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, weft_mats, 'row');
    d.colShuttleMapping = (0, draft_1.generateMappingFromPattern)(d.drawdown, warp_mats, 'col');
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const name_list = (0, operations_1.parseDraftNames)(drafts);
    return "layer(" + name_list + ")";
};
const sizeCheck = (op_settings, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return true;
    const ends = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.warps)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    const pics = (0, utils_1.lcm)(drafts.map(el => (0, draft_1.wefts)(el.drawdown)), utils_1.defaults.lcm_timeout) * drafts.length;
    return (ends * pics <= utils_1.defaults.max_area) ? true : false;
};
exports.layer = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=layer.js.map