"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rectangle = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const __1 = require("..");
const categories_1 = require("../categories");
const utils_1 = require("../../utils");
const name = "rectangle";
const meta = {
    displayname: 'rectangle',
    desc: 'Generates an unfilled rectangle of the size defined by the parameters. If given an input, the rectangle fills with the input.',
    img: 'rectangle.png',
    categories: [categories_1.clothOp],
};
//PARAMS
const ends = {
    name: 'ends',
    type: 'number',
    min: 1,
    max: 5000,
    value: 10,
    dx: ""
};
const pics = {
    name: 'pics',
    type: 'number',
    min: 1,
    max: 5000,
    value: 10,
    dx: ""
};
const params = [ends, pics];
//INLETS
const draft_inlet = {
    name: 'input draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft with which you would like to fill this rectangle',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, __1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    const w = (0, __1.getOpParamValById)(0, op_params);
    const h = (0, __1.getOpParamValById)(1, op_params);
    const seq = new sequence_1.Sequence.TwoD();
    if (input_draft !== null)
        seq.import(input_draft.drawdown);
    else
        seq.setBlank();
    const dd = seq.fill(w, h).export();
    let d = (0, draft_1.initDraftFromDrawdown)(dd);
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, input_draft);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'rect(' + (0, __1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = (param_vals) => {
    const ends = (0, __1.getOpParamValById)(0, param_vals);
    const pics = (0, __1.getOpParamValById)(1, param_vals);
    return (ends * pics <= utils_1.defaults.max_area) ? true : false;
};
exports.rectangle = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=rectangle.js.map