"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fill = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const operations_1 = require("../../operations");
const categories_1 = require("../categories");
const name = "fill";
const meta = {
    displayname: 'fill',
    desc: 'Fills black cells of the first input, “pattern,” with the draft specified by the second input, and the white cells with draft specified by the third input.',
    img: 'fill.png',
    categories: [categories_1.clothOp],
    advanced: true
};
//PARAMS
const params = [];
//INLETS
const pattern = {
    name: 'pattern',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'a draft you would like to fill',
    num_drafts: 1
};
const black_cells = {
    name: 'black cell structure',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the structure you would like to repeat in in the black regions of the base draft',
    num_drafts: 1
};
const white_cells = {
    name: 'white cell structure',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the structure you would like to repeat in in the white regions of the base draft',
    num_drafts: 1
};
const inlets = [pattern, black_cells, white_cells];
const perform = (op_params, op_inputs) => {
    const to_fills = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const black_cells = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const white_cells = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 2);
    if (to_fills.length == 0)
        return Promise.resolve([]);
    const black_cell = (black_cells.length == 0) ? (0, draft_1.initDraftFromDrawdown)([[(0, draft_1.createCell)(true)]]) : black_cells[0];
    const white_cell = (white_cells.length == 0) ? (0, draft_1.initDraftFromDrawdown)([[(0, draft_1.createCell)(false)]]) : white_cells[0];
    const to_fill = to_fills[0];
    const pattern = new sequence_1.Sequence.TwoD();
    to_fill.drawdown.forEach((row, i) => {
        const seq = new sequence_1.Sequence.OneD();
        row.forEach((cell, j) => {
            if (cell.is_set) {
                if (cell.is_up) {
                    seq.push((0, draft_1.getHeddle)(black_cell.drawdown, i % (0, draft_1.wefts)(black_cell.drawdown), j % (0, draft_1.warps)(black_cell.drawdown)));
                }
                else {
                    seq.push((0, draft_1.getHeddle)(white_cell.drawdown, i % (0, draft_1.wefts)(white_cell.drawdown), j % (0, draft_1.warps)(white_cell.drawdown)));
                }
            }
            else {
                seq.push(2);
            }
        });
        pattern.pushWeftSequence(seq.val());
    });
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, to_fill);
    d = (0, draft_1.updateWarpSystemsAndShuttles)(d, to_fill);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    return 'fill(' + (0, operations_1.parseDraftNames)(drafts) + ")";
};
const sizeCheck = () => {
    return true;
};
exports.fill = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=fill.js.map