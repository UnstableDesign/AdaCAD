"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splice_in_warps = void 0;
const draft_1 = require("../../draft");
const sequence_1 = require("../../sequence");
const utils_1 = require("../../utils");
const categories_1 = require("../categories");
const operations_1 = require("../operations");
const name = "splice_in_warps";
const meta = {
    displayname: 'splice in ends',
    desc: 'Splices the ends of the `splicing draft` input draft into the `receiving draft`. You can use the parameters to describe if you want the entire draft spliced in, or to splice the draft in end by end and the amount of ends between each insertion.',
    img: 'splice_in_warps.png',
    categories: [categories_1.compoundOp],
    advanced: true,
    old_names: ['splice in warps']
};
//PARAMS
const ends_btwn = {
    name: 'ends between insertions',
    type: 'number',
    min: 1,
    max: 5000,
    value: 1,
    dx: "the number of ends to keep between each splice"
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
const params = [ends_btwn, repeats, style];
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
    const ends_btwn = (0, operations_1.getOpParamValById)(0, op_params);
    const repeat = (0, operations_1.getOpParamValById)(1, op_params);
    const style = (0, operations_1.getOpParamValById)(2, op_params);
    const receiving_draft = (receiving_drafts.length == 0) ? null : receiving_drafts[0];
    const splicing_draft = (splicing_drafts.length == 0) ? null : splicing_drafts[0];
    const all_drafts = [receiving_draft, splicing_draft].filter((d) => d !== null);
    if (all_drafts.length == 0)
        return Promise.resolve([]);
    if (receiving_draft == null || splicing_draft == null)
        return Promise.resolve([]);
    let total_warps = 0;
    let factors = [];
    if (repeat === 1) {
        if (style) {
            factors = [(0, draft_1.warps)(receiving_draft.drawdown), ((0, draft_1.warps)(splicing_draft.drawdown) * (ends_btwn + (0, draft_1.warps)(splicing_draft.drawdown)))];
        }
        else {
            factors = [(0, draft_1.warps)(receiving_draft.drawdown), (0, draft_1.warps)(splicing_draft.drawdown) * (ends_btwn + 1)];
        }
        total_warps = (0, utils_1.lcm)(factors, utils_1.defaults.lcm_timeout);
    }
    else {
        //sums the warps from all the drafts
        total_warps = all_drafts.reduce((acc, el) => {
            return acc + (0, draft_1.warps)((el) ? el.drawdown : []);
        }, 0);
    }
    let total_wefts = 0;
    const all_wefts = all_drafts.map(el => (0, draft_1.wefts)((el) ? el.drawdown : [])).filter(el => el !== null);
    if (repeat === 1)
        total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    else
        total_wefts = (0, utils_1.getMaxWefts)(all_drafts);
    const uniqueSystemCols = (0, draft_1.makeSystemsUnique)(all_drafts.map(el => el.colSystemMapping));
    let array_a_ndx = 0;
    let array_b_ndx = 0;
    //create a draft to hold the merged values
    // const d:Draft = initDraftWithParams({warps: total_warps, wefts:total_wefts, rowShuttleMapping:static_input.rowShuttleMapping, rowSystemMapping:static_input.rowSystemMapping});
    const pattern = new sequence_1.Sequence.TwoD();
    const col_shuttle = [];
    const col_system = [];
    for (let j = 0; j < total_warps; j++) {
        let select_array;
        if (style) {
            const cycle = ends_btwn + (0, draft_1.warps)(splicing_draft.drawdown);
            select_array = (j % (cycle) >= ends_btwn) ? 1 : 0;
        }
        else {
            select_array = (j % (ends_btwn + 1) === ends_btwn) ? 1 : 0;
        }
        if (!repeat) {
            if (array_b_ndx >= (0, draft_1.warps)(splicing_draft.drawdown))
                select_array = 0;
            if (array_a_ndx >= (0, draft_1.warps)(receiving_draft.drawdown))
                select_array = 1;
        }
        const cur_warp_num = (0, draft_1.warps)(all_drafts[select_array].drawdown);
        const ndx = (select_array === 0) ? array_a_ndx % cur_warp_num : array_b_ndx % cur_warp_num;
        const seq = new sequence_1.Sequence.OneD();
        for (let i = 0; i < total_wefts; i++) {
            const cur_weft_num = (0, draft_1.wefts)(all_drafts[select_array].drawdown);
            if (i >= cur_weft_num && !repeat)
                seq.push(2);
            seq.push((0, draft_1.getHeddle)(all_drafts[select_array].drawdown, i % cur_weft_num, ndx));
        }
        pattern.pushWarpSequence(seq.val());
        // const col:Array<Cell> = d.drawdown.reduce((acc, el) => {
        //   acc.push(el[j]);
        //   return acc;
        // }, [])
        col_system.push(uniqueSystemCols[select_array][ndx]);
        col_shuttle.push(all_drafts[select_array].colShuttleMapping[ndx]);
        if (select_array === 0) {
            array_a_ndx++;
        }
        else {
            array_b_ndx++;
        }
    }
    let d = (0, draft_1.initDraftFromDrawdown)(pattern.export());
    d.colShuttleMapping = col_shuttle.slice();
    d.colSystemMapping = col_system.slice();
    d = (0, draft_1.updateWeftSystemsAndShuttles)(d, receiving_draft);
    // this.transferSystemsAndShuttles(d,op_input.drafts,op_input.params, 'interlace');
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
    const ends_btwn = (0, operations_1.getOpParamValById)(0, op_params);
    const repeat = (0, operations_1.getOpParamValById)(1, op_params);
    const style = (0, operations_1.getOpParamValById)(2, op_params);
    const receiving_draft = (receiving_drafts.length == 0) ? null : receiving_drafts[0];
    const splicing_draft = (splicing_drafts.length == 0) ? null : splicing_drafts[0];
    const all_drafts = [receiving_draft, splicing_draft].filter((d) => d !== null);
    if (all_drafts.length == 0)
        return true;
    if (receiving_draft == null || splicing_draft == null)
        return true;
    let total_warps = 0;
    let factors = [];
    if (repeat === 1) {
        if (style) {
            factors = [(0, draft_1.warps)(receiving_draft.drawdown), ((0, draft_1.warps)(splicing_draft.drawdown) * (ends_btwn + (0, draft_1.warps)(splicing_draft.drawdown)))];
        }
        else {
            factors = [(0, draft_1.warps)(receiving_draft.drawdown), (0, draft_1.warps)(splicing_draft.drawdown) * (ends_btwn + 1)];
        }
        total_warps = (0, utils_1.lcm)(factors, utils_1.defaults.lcm_timeout);
    }
    else {
        //sums the warps from all the drafts
        total_warps = all_drafts.reduce((acc, el) => {
            return acc + (0, draft_1.warps)((el) ? el.drawdown : []);
        }, 0);
    }
    let total_wefts = 0;
    const all_wefts = all_drafts.map(el => (0, draft_1.wefts)((el) ? el.drawdown : [])).filter(el => el !== null);
    if (repeat === 1)
        total_wefts = (0, utils_1.lcm)(all_wefts, utils_1.defaults.lcm_timeout);
    else
        total_wefts = (0, utils_1.getMaxWefts)(all_drafts);
    return (total_warps * total_wefts <= utils_1.defaults.max_area) ? true : false;
};
exports.splice_in_warps = { name, meta, params, inlets, perform, generateName, sizeCheck };
//# sourceMappingURL=splice_in_warps.js.map