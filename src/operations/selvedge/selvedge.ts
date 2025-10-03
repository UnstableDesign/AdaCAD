import { warps, wefts, getHeddle, initDraftFromDrawdown, updateWeftSystemsAndShuttles } from "../../draft";
import { Sequence } from "../../sequence";
import { getAllDraftsAtInlet, getOpParamValById, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput } from "../types";
import { helperOp } from "../categories";

const name = "selvedge";

const meta: OpMeta = {
    displayname: 'selvedge',
    desc: "Adds a selvedge of so many ends on both sides of the input draft, 'draft.' The second input, 'selvedge,' determines the selvedge pattern, and if none is given, a selvedge is generated.",
    img: 'selvedge.png',
    categories: [helperOp],
    advanced: true
}


//PARAMS
const ends: NumParam =
{
    name: 'ends',
    type: 'number',
    min: 1,
    max: 5000,
    value: 12,
    dx: "the number of ends of selvedge on each side of the cloth"
}

const right_shift: NumParam =
{
    name: 'right shift',
    type: 'number',
    min: 0,
    max: 5000,
    value: 0,
    dx: "the number of pics to shift the right side by to ensure the ends catch"
}





const params = [ends, right_shift];

//INLETS
const draft: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: "the draft that will have a selvedge added",
    num_drafts: 1
}

const selvedge_draft: OperationInlet = {
    name: 'selvedge',
    type: 'static',
    value: null,
    dx: "the pattern to use for the selvedge",
    uses: "draft",
    num_drafts: 1
}


const inlets = [draft, selvedge_draft];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {

    const draft = getAllDraftsAtInlet(op_inputs, 0);
    const sel = getAllDraftsAtInlet(op_inputs, 1);
    const w = <number>getOpParamValById(0, op_params);
    const shift = <number>getOpParamValById(1, op_params);

    if (draft.length == 0 && sel.length == 0) return Promise.resolve([]);

    if (draft.length == 0) return Promise.resolve([{ draft: sel[0] }]);
    if (sel.length == 0) return Promise.resolve([{ draft: draft[0] }]);


    const complete = new Sequence.TwoD();
    const active_draft = draft[0];
    const sel_draft = sel[0];
    const sel_draft_warps = warps(sel_draft.drawdown);
    const sel_draft_wefts = wefts(sel_draft.drawdown);
    const warp_systems: Array<number> = [];
    const warp_materials: Array<number> = [];

    active_draft.drawdown.forEach((row, i) => {
        const row_seq = new Sequence.OneD();

        for (let j = 0; j < w; j++) {
            row_seq.push(getHeddle(sel_draft.drawdown, i % sel_draft_wefts, j % sel_draft_warps))
            if (i == 0) warp_materials.push(sel_draft.colShuttleMapping[j % sel_draft_warps]);
            if (i == 0) warp_systems.push(sel_draft.colSystemMapping[j % sel_draft_warps]);
        }

        for (let j = 0; j < row.length; j++) {
            row_seq.push(getHeddle(active_draft.drawdown, i, j))
            if (i == 0) warp_materials.push(active_draft.colShuttleMapping[j]);
            if (i == 0) warp_systems.push(active_draft.colSystemMapping[j]);
        }

        for (let j = 0; j < w; j++) {
            row_seq.push(getHeddle(sel_draft.drawdown, (i + shift) % sel_draft_wefts, j % sel_draft_warps));
            if (i == 0) warp_materials.push(sel_draft.colShuttleMapping[j % sel_draft_warps]);
            if (i == 0) warp_systems.push(sel_draft.colSystemMapping[j % sel_draft_warps]);
        }

        complete.pushWeftSequence(row_seq.val());


    })

    let d = initDraftFromDrawdown(complete.export());
    d = updateWeftSystemsAndShuttles(d, active_draft);
    d.colShuttleMapping = warp_materials.slice();
    d.colSystemMapping = warp_systems.slice();



    return Promise.resolve([{ draft: d }]);

};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

    const r = getAllDraftsAtInlet(op_inputs, 0);
    const name_list = parseDraftNames(r);
    return name_list + "+selvedge";
}


export const selvedge: Operation = { name, meta, params, inlets, perform, generateName };

