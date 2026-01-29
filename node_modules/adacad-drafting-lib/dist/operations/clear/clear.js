"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clear = void 0;
const draft_1 = require("../../draft");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "clear";
const meta = {
    displayname: 'clear',
    advanced: true,
    categories: [categories_1.transformationOp],
    desc: "Converts all the interlacements in the input draft to be raised.",
    img: 'clear.png'
};
//PARAMS
const params = [];
//INLETS
const draft_inlet = {
    name: 'input draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to clear',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    let d = (0, draft_1.initDraftWithParams)({
        wefts: (0, draft_1.wefts)(input_draft.drawdown),
        warps: (0, draft_1.warps)(input_draft.drawdown),
        drawdown: [[(0, draft_1.createCell)(true)]]
    });
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, input_draft);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'clear(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.clear = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=clear.js.map