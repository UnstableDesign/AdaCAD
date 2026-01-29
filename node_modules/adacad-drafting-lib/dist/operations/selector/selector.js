"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selector = void 0;
const draft_1 = require("../../draft");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "selector";
const meta = {
    displayname: 'selector',
    desc: 'allows the user to switch between the connected inputs by changing the parameter number. ',
    img: 'selector.png',
    categories: [categories_1.helperOp],
    advanced: true
};
//PARAMS
const selection = {
    name: 'selected input',
    type: 'number',
    min: 1,
    max: 10000,
    value: 1,
    dx: "which of the active inputs is selected at this time"
};
const params = [selection];
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'a collection of drafts you can switch between',
    num_drafts: -1
};
const inlets = [draft_inlet];
const perform = (param_vals, op_inputs) => {
    const selection = (0, operations_1.getOpParamValById)(0, param_vals);
    const inputs = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if ((selection - 1) < inputs.length) {
        const copy = (0, draft_1.copyDraft)(inputs[selection - 1]);
        return Promise.resolve([{ draft: copy }]);
    }
    else {
        const draft = (0, draft_1.initDraftWithParams)({ wefts: 1, warps: 1 });
        return Promise.resolve([{ draft }]);
    }
};
const generateName = (param_vals, op_inputs) => {
    const selection = (0, operations_1.getOpParamValById)(0, param_vals);
    if ((selection - 1) < op_inputs.length) {
        const name = (0, draft_1.getDraftName)(op_inputs[selection - 1].drafts[0]);
        return 'selected:' + name;
    }
    else {
        return 'selected: none';
    }
};
const sizeCheck = () => {
    return true;
};
exports.selector = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=selector.js.map