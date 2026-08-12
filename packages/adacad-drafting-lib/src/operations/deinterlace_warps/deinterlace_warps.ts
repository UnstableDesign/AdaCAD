import { Draft, initDraftFromDrawdown, updateWarpSystemsAndShuttles, getDraftName, warps } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput } from "../types";
import { dissectOp } from "../categories";

const name = "deinterlace_warps";

const meta: OpMeta = {
    displayname: 'deinterlace warps',
    advanced: true,
    categories: [dissectOp],
    img: 'deinterlace_warps.png',
    desc: 'Creates multiple draft by splitting each end from the input and assigning it to separate drafts. If the factor of two, two drafts are created. The first with all the odd ends and the second with all the even ends. If 3 is selected, three drafts are created, and so on'

}

//PARAMS

const split_by: NumParam =
{
    name: 'factor',
    type: 'number',
    min: 2,
    max: 500,
    value: 2,
    dx: "this number determines how many times the input draft will be divided"
};



const params = [split_by];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'drafts',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft you would like to split apart',
    num_drafts: 1
}


const inlets = [draft_inlet];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {


    const input_draft = getInputDraft(op_inputs);
    const factor: number = <number>getOpParamValById(0, op_params);

    if (input_draft == null) return Promise.resolve([]);

    const patterns: Array<Sequence.TwoD> = [];
    const drafts: Array<Draft> = [];
    const col_shuttle: Array<Array<number>> = [];
    const col_system: Array<Array<number>> = [];

    for (let i = 0; i < factor; i++) {
        patterns.push(new Sequence.TwoD());
        col_shuttle.push([]);
        col_system.push([]);
    }

    const original_draft = new Sequence.TwoD().import(input_draft.drawdown);

    for (let j = 0; j < warps(input_draft.drawdown); j++) {
        const selected_draft_id = j % factor;
        const col = new Sequence.OneD([]).import(original_draft.getWarp(j));
        patterns[selected_draft_id].pushWarpSequence(col.val());
        col_shuttle[selected_draft_id].push(input_draft.colShuttleMapping[j])
        col_system[selected_draft_id].push(input_draft.colSystemMapping[j])
    }

    for (let i = 0; i < factor; i++) {

        let d = initDraftFromDrawdown(patterns[i].export());
        d.colShuttleMapping = col_shuttle[i].slice();
        d.colSystemMapping = col_system[i].slice();
        d = updateWarpSystemsAndShuttles(d, input_draft);
        drafts.push(d);
    }


    const outputs = drafts.map(el => { return { draft: el } })

    return Promise.resolve(outputs);
};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const input_draft = getInputDraft(op_inputs);
    if (input_draft == null) return "deinterlaced(null)";
    return "deinterlaced(" + getDraftName(input_draft) + ")";
}

const sizeCheck = (): boolean => {
    return true;
}

export const deinterlace_warps: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };