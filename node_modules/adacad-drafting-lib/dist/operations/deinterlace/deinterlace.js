"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deinterlace = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "deinterlace";
const meta = {
    displayname: 'deinterlace wefts',
    advanced: true,
    categories: [categories_1.dissectOp],
    img: 'deinterlace.png',
    desc: 'Creates multiple draft by splitting each pic from the input and assigning it to separate drafts. If the factor of two, two drafts are created. The first with all the odd pics and the send with all the even. If 3 is selected, three drafts are created, and so on'
};
//PARAMS
const split_by = {
    name: 'factor',
    type: 'number',
    min: 2,
    max: 500,
    value: 2,
    dx: "this number determines how many times the input draft will be divided"
};
const params = [split_by];
//INLETS
const draft_inlet = {
    name: 'drafts',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to split apart',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    const factor = (0, operations_1.getOpParamValById)(0, op_params);
    if (input_draft == null)
        return Promise.resolve([]);
    const patterns = [];
    const drafts = [];
    const row_shuttle = [];
    const row_system = [];
    for (let i = 0; i < factor; i++) {
        patterns.push(new sequence_1.Sequence.TwoD());
        row_shuttle.push([]);
        row_system.push([]);
    }
    for (let i = 0; i < (0, draft_1.wefts)(input_draft.drawdown); i++) {
        const selected_draft_id = i % factor;
        const row = new sequence_1.Sequence.OneD([]).import(input_draft.drawdown[i]);
        patterns[selected_draft_id].pushWeftSequence(row.val());
        row_shuttle[selected_draft_id].push(input_draft.rowShuttleMapping[i]);
        row_system[selected_draft_id].push(input_draft.rowSystemMapping[i]);
    }
    for (let i = 0; i < factor; i++) {
        let d = (0, draft_1.initDraftFromDrawdown)(patterns[i].export());
        d.rowShuttleMapping = row_shuttle[i].slice();
        d.rowSystemMapping = row_system[i].slice();
        d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
        drafts.push(d);
    }
    const outputs = drafts.map(el => { return { draft: el }; });
    return Promise.resolve(outputs);
};
const generateName = (param_vals, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return "deinterlaced(null)";
    return "deinterlaced(" + (0, draft_1.getDraftName)(input_draft) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.deinterlace = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=deinterlace.js.map