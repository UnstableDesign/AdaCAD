"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.erase_blank = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const utils_1 = require("../../utils");
const name = "erase blank rows";
const meta = {
    displayname: 'erase blank rows',
    desc: 'helper',
    img: '',
    categories: [],
    advanced: true,
    draft: true
};
//PARAMS
const params = [];
//INLETS
const draft_inlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to erase blank rows from',
    num_drafts: 1
};
const inlets = [draft_inlet];
const perform = (op_params, op_inputs) => {
    const input_draft = (0, operations_1.getInputDraft)(op_inputs);
    if (input_draft == null)
        return Promise.resolve([]);
    const pattern = new sequence_1.Sequence.TwoD();
    const weft_sys = new sequence_1.Sequence.OneD();
    const weft_mats = new sequence_1.Sequence.OneD();
    input_draft.drawdown.forEach((row, i) => {
        const seq = new sequence_1.Sequence.OneD().import(row);
        if (!(0, utils_1.hasOnlyUnsetOrDown)(row)) {
            pattern.pushWeftSequence(seq.val());
            weft_sys.push(input_draft.rowSystemMapping[i]);
            weft_mats.push(input_draft.rowShuttleMapping[i]);
        }
    });
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.rowShuttleMapping = weft_mats.val();
    d.rowSystemMapping = weft_sys.val();
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, input_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'eraseblank(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.erase_blank = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=erase_blank.js.map