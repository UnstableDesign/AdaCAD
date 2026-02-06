"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invert = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "invert";
const meta = {
    displayname: 'invert',
    desc: 'Inverts the draft so that raised warp ends become weft picks and weft pics become raised warp ends.',
    img: 'invert.png',
    categories: [categories_1.transformationOp],
};
//PARAMS
const params = [];
//INLETS
const input = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to invert',
    num_drafts: 1
};
const inlets = [input];
const perform = (param_vals, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    const pattern = new sequence_1.Sequence.TwoD();
    input_draft.drawdown.forEach(row => {
        const r = new sequence_1.Sequence.OneD().import(row).invert().val();
        pattern.pushWeftSequence(r);
    });
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, input_draft);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'invert(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.invert = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=invert.js.map