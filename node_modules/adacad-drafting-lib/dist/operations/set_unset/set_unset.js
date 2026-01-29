"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.set_unset = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const __1 = require("..");
const categories_1 = require("../categories");
const name = "set_unset";
const meta = {
    displayname: 'set unset',
    desc: 'Sets all unset interlacements/cells in this draft to the value set in the parameter.',
    img: 'set_unset.png',
    categories: [categories_1.transformationOp],
    advanced: true,
    old_names: ['unset', 'set unset']
};
//PARAMS
const liftlower = {
    name: 'lift/lower',
    type: 'boolean',
    falsestate: 'unset to warp lift',
    truestate: 'unset to warp lower',
    value: 1,
    dx: ''
};
const params = [liftlower];
//INLETS
const draft_inlet = {
    name: 'input draft',
    type: 'static',
    value: null,
    dx: 'the draft you would like to modify',
    uses: "draft",
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, __1.getInputDraft)(op_inputs);
    const set_up = (0, __1.getOpParamValById)(0, op_params);
    if (input_draft == null)
        return Promise.resolve([]);
    const pattern = new sequence_1.Sequence.TwoD();
    input_draft.drawdown.forEach(row => {
        const set = row.map(el => {
            if (!el.is_set) {
                if (set_up == 1)
                    return (0, draft_1.createCell)(false);
                else
                    return (0, draft_1.createCell)(true);
            }
            return el;
        });
        pattern.pushWeftSequence(new sequence_1.Sequence.OneD().import(set).val());
    });
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, input_draft);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, __1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'set unset interlacements(' + (0, __1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.set_unset = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=set_unset.js.map