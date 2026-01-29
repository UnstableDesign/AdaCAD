"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splice_in_wefts = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "splice_in_wefts";
const meta = {
    displayname: 'splice in pics',
    desc: 'Splices the pics of the `splicing draft` input draft into the `receiving draft`. You can use the parameters to describe if you want the entire draft spliced in, or to splice the draft in pic by pic and the amount of pics between each insertion.',
    img: 'splice_in_wefts.png',
    categories: [categories_1.compoundOp],
    advanced: true,
    old_names: ['splice in wefts']
};
//PARAMS
const pics_btwn = {
    name: 'pics between insertions',
    type: 'number',
    min: 1,
    max: 5000,
    value: 1,
    dx: "the number of pics to keep between each splice row"
};
const repeats = {
    name: 'calculate repeats',
    type: 'boolean',
    falsestate: 'do not repeat inputs to match size',
    truestate: 'repeat inputs to match size',
    value: 1,
    dx: ""
};
const style = {
    name: 'splice style',
    type: 'boolean',
    falsestate: 'line by line',
    truestate: 'whole draft',
    value: 0,
    dx: "controls if the whole draft is spliced in every nth weft or just the next pic in the draft"
};
const params = [pics_btwn, repeats, style];
//INLETS
const receiving = {
    name: 'receiving draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'all the drafts you would like to interlace',
    num_drafts: 1
};
const splicing = {
    name: 'splicing draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to splice into the recieving draft',
    num_drafts: 1
};
const inlets = [receiving, splicing];
const perform = (op_params, op_inputs) => {
    const receiving_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const splicing_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const pics_btwn = (0, operations_1.getOpParamValById)(0, op_params);
    const repeat = (0, operations_1.getOpParamValById)(1, op_params);
    const style = (0, operations_1.getOpParamValById)(2, op_params);
    const receiving_draft = (receiving_drafts.length == 0) ? null : receiving_drafts[0];
    const splicing_draft = (splicing_drafts.length == 0) ? null : splicing_drafts[0];
    const all_drafts = [receiving_draft, splicing_draft].filter((d) => d !== null);
    if (all_drafts.length == 0)
        return Promise.resolve([]);
    if (receiving_draft == null || splicing_draft == null)
        return Promise.resolve([]);
    let total_wefts = 0;
    if (repeat === 1) {
        let factors = [];
        if (style) {
            factors = [(0, draft_1.wefts)(splicing_draft.drawdown), (0, draft_1.wefts)(splicing_draft.drawdown) * (pics_btwn + (0, draft_1.wefts)(splicing_draft.drawdown))];
        }
        else {
            factors = [(0, draft_1.wefts)(receiving_draft.drawdown), (0, draft_1.wefts)(splicing_draft.drawdown) * (pics_btwn + 1)];
        }
        total_wefts = (0, utils_1.lcm)(factors, utils_1.defaults.lcm_timeout);
    }
    else {
        //sums the wefts from all the drafts
        total_wefts = all_drafts.reduce((acc, el) => {
            return acc + (0, draft_1.wefts)((el) ? el.drawdown : []);
        }, 0);
    }
    let total_warps = 0;
    const all_warps = all_drafts.map(el => (0, draft_1.warps)((el) ? el.drawdown : [])).filter(el => el > 0);
    if (repeat === 1)
        total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    else
        total_warps = (0, utils_1.getMaxWarps)(all_drafts);
    const uniqueSystemRows = (0, draft_1.makeSystemsUnique)(all_drafts.map(el => el.rowSystemMapping));
    let array_a_ndx = 0;
    let array_b_ndx = 0;
    const row_shuttle = [];
    const row_system = [];
    const pattern = new sequence_1.Sequence.TwoD();
    for (let i = 0; i < total_wefts; i++) {
        let select_array = 0;
        if (style) {
            const cycle = pics_btwn + (0, draft_1.wefts)(splicing_draft.drawdown);
            select_array = (i % cycle >= pics_btwn) ? 1 : 0;
        }
        else {
            select_array = (i % (pics_btwn + 1) === pics_btwn) ? 1 : 0;
        }
        if (!repeat) {
            if (array_b_ndx >= (0, draft_1.wefts)(splicing_draft.drawdown))
                select_array = 0;
            if (array_a_ndx >= (0, draft_1.warps)(receiving_draft.drawdown))
                select_array = 1;
        }
        const cur_weft_num = (0, draft_1.wefts)(all_drafts[select_array].drawdown);
        const ndx = (select_array === 0) ? array_a_ndx % cur_weft_num : array_b_ndx % cur_weft_num;
        const seq = new sequence_1.Sequence.OneD();
        for (let j = 0; j < total_warps; j++) {
            const cur_warp_num = (0, draft_1.warps)(all_drafts[select_array].drawdown);
            if (j >= cur_warp_num && !repeat)
                seq.push(2);
            else
                seq.push((0, draft_1.getHeddle)(all_drafts[select_array].drawdown, ndx, j % cur_warp_num));
        }
        row_system.push(uniqueSystemRows[select_array][ndx]);
        row_shuttle.push(all_drafts[select_array].rowShuttleMapping[ndx]);
        pattern.pushWeftSequence(seq.val());
        if (select_array === 0) {
            array_a_ndx++;
        }
        else {
            array_b_ndx++;
        }
    }
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.rowShuttleMapping = row_shuttle;
    d.rowSystemMapping = row_system.slice();
    if (receiving_draft !== null)
        d = (0, draft_1.updateWarpSystemsAndShuttles)(d, receiving_draft);
    return Promise.resolve([{ draft: d }]);
};
const generateName = (param_vals, op_inputs) => {
    const r = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const s = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const name_list = (0, operations_1.parseDraftNames)(r.concat(s));
    return "spliced(" + name_list + ")";
};
const sizeCheck = (op_params, op_inputs) => {
    const receiving_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 0);
    const splicing_drafts = (0, operations_1.getAllDraftsAtInlet)(op_inputs, 1);
    const pics_btwn = (0, operations_1.getOpParamValById)(0, op_params);
    const repeat = (0, operations_1.getOpParamValById)(1, op_params);
    const style = (0, operations_1.getOpParamValById)(2, op_params);
    const receiving_draft = (receiving_drafts.length == 0) ? null : receiving_drafts[0];
    const splicing_draft = (splicing_drafts.length == 0) ? null : splicing_drafts[0];
    const all_drafts = [receiving_draft, splicing_draft].filter((d) => d !== null);
    if (all_drafts.length == 0)
        return true;
    if (receiving_draft == null || splicing_draft == null)
        return true;
    let total_wefts = 0;
    if (repeat === 1) {
        let factors = [];
        if (style) {
            factors = [(0, draft_1.wefts)(splicing_draft.drawdown), (0, draft_1.wefts)(splicing_draft.drawdown) * (pics_btwn + (0, draft_1.wefts)(splicing_draft.drawdown))];
        }
        else {
            factors = [(0, draft_1.wefts)(receiving_draft.drawdown), (0, draft_1.wefts)(splicing_draft.drawdown) * (pics_btwn + 1)];
        }
        total_wefts = (0, utils_1.lcm)(factors, utils_1.defaults.lcm_timeout);
    }
    else {
        //sums the wefts from all the drafts
        total_wefts = all_drafts.reduce((acc, el) => {
            return acc + (0, draft_1.wefts)((el) ? el.drawdown : []);
        }, 0);
    }
    let total_warps = 0;
    const all_warps = all_drafts.map(el => (0, draft_1.warps)((el) ? el.drawdown : [])).filter(el => el > 0);
    if (repeat === 1)
        total_warps = (0, utils_1.lcm)(all_warps, utils_1.defaults.lcm_timeout);
    else
        total_warps = (0, utils_1.getMaxWarps)(all_drafts);
    return (total_warps * total_wefts <= utils_1.defaults.max_area) ? true : false;
};
exports.splice_in_wefts = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=splice_in_wefts.js.map