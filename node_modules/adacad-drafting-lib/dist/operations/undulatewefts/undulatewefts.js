"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.undulatewefts = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const name = "undulatewefts";
const meta = {
    displayname: 'undulate wefts',
    desc: 'Given a user specified input of a series of number, it shifts every pic by the value specified in the corresponding location of the user specified input. For example, if 1 3 1 is entered, it shifts the first pic to the right by 1, second to the right by 3, third by 1',
    img: 'undulatewefts.png',
    categories: [categories_1.transformationOp],
    advanced: true
};
//PARAMS
const shift_pattern = {
    name: 'undulation pattern',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'shifts each pic of the input draft according to the number sequence specified.'
};
const params = [shift_pattern];
//INLETS
const draft_input = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to undulate',
    num_drafts: 1
};
const inlets = [draft_input];
const perform = (param_vals, op_inputs) => {
    const undulating_string = (0, operations_1.getOpParamValById)(0, param_vals);
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    if (drafts.length == 0)
        return Promise.resolve([]);
    const regex_matches = (0, utils_1.parseRegex)(undulating_string, shift_pattern.regex);
    const undulating_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el));
    const pattern = new sequence_1.Sequence.TwoD();
    let max_wefts = 0;
    let max_warps = 0;
    max_wefts = (0, draft_1.wefts)(drafts[0].drawdown);
    max_warps = (0, draft_1.warps)(drafts[0].drawdown);
    for (let i = 0; i < max_wefts; i++) {
        const und_val = undulating_array[i % undulating_array.length];
        pattern.pushWeftSequence(new sequence_1.Sequence.OneD()
            .import(drafts[0].drawdown[i % (0, draft_1.wefts)(drafts[0].drawdown)])
            .resize(max_warps)
            .shift(und_val)
            .val());
    }
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, drafts[0]);
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, drafts[0]);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals) => {
    return 'undulate wefts(' + param_vals[0].val + ')';
};
const sizeCheck = () => {
    return true;
};
exports.undulatewefts = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=undulatewefts.js.map