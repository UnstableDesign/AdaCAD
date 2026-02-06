"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindweftfloats = void 0;
const draft_1 = require("../../draft");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "bind weft floats";
const meta = {
    displayname: 'bind weft floats',
    desc: 'Adds interlacements to weft floats over the user specified length',
    img: '',
    categories: [categories_1.helperOp],
    advanced: true,
    draft: true
};
//PARAMS
const max_float = {
    name: 'max float length',
    type: 'number',
    min: 1,
    max: 1000000,
    value: 10,
    dx: 'the maximum length of a weft float'
};
const params = [max_float];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    dx: 'the draft to bind',
    uses: "draft",
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    const max_float = (0, operations_1.getOpParamValById)(0, op_params);
    if (input_draft == null)
        return Promise.resolve([]);
    let float_len = 0;
    let last = false;
    for (let i = 0; i < (0, draft_1.wefts)(input_draft.drawdown); i++) {
        float_len = 1;
        last = null;
        for (let j = 0; j < (0, draft_1.warps)(input_draft.drawdown); j++) {
            if ((0, draft_1.getHeddle)(input_draft.drawdown, i, j) === null) {
                float_len = 1;
                last = null;
            }
            else if (last === null) {
                float_len = 1;
                last = (0, draft_1.getHeddle)(input_draft.drawdown, i, j);
            }
            else if ((0, draft_1.getHeddle)(input_draft.drawdown, i, j) === last) {
                float_len++;
                if (float_len > max_float) {
                    input_draft.drawdown[i][j] = (0, draft_1.toggleHeddle)(input_draft.drawdown[i][j]);
                    last = (0, draft_1.getHeddle)(input_draft.drawdown, i, j);
                    float_len = 1;
                }
            }
            else if ((0, draft_1.getHeddle)(input_draft.drawdown, i, j) !== last) {
                float_len = 1;
                last = (0, draft_1.getHeddle)(input_draft.drawdown, i, j);
            }
        }
    }
    return Promise.resolve([{ draft: input_draft }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'bound wefts(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.bindweftfloats = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=bindweftfloats.js.map