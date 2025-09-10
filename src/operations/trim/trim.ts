import { Draft, wefts, warps, getHeddle, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "trim";
const old_names: Array<string> = [];


//PARAMS
const starting_ends: NumParam =
{
    name: 'ends from start',
    type: 'number',
    min: 0,
    max: 10000,
    value: 1,
    dx: 'number of pics from the origin to start to remove'
}

const staring_pics: NumParam = {
    name: 'pics from start',
    min: 0,
    max: 10000,
    value: 1,
    type: 'number',
    dx: 'number of ends from the origin to start to remove'
}

const ending_ends: NumParam =
{
    name: 'ends from the end',
    type: 'number',
    min: 1,
    max: 10000,
    value: 1,
    dx: 'number of ends from the opposite edge of the origin to remove'
}

const ending_pics: NumParam =
{
    name: 'pics from the end',
    type: 'number',
    min: 1,
    max: 10000,
    value: 1,
    dx: 'number of pics from the opposite edge of the origin to remove'
}






const params = [starting_ends, staring_pics, ending_ends, ending_pics];

//INLETS
const draft: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft to trim',
    num_drafts: 1
}



const inlets = [draft];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {

    const draft = getInputDraft(op_inputs);
    const left = <number>getOpParamValById(0, op_params);
    const top = <number>getOpParamValById(1, op_params);
    const right = <number>getOpParamValById(2, op_params);
    const bottom = <number>getOpParamValById(3, op_params);


    if (draft == null) return Promise.resolve([]);

    const warp_systems = new Sequence.OneD();
    const warp_mats = new Sequence.OneD();
    const weft_systems = new Sequence.OneD();
    const weft_materials = new Sequence.OneD();

    const pattern = new Sequence.TwoD();

    //start with starting pics
    for (let i = top; i < wefts(draft.drawdown) - bottom; i++) {

        const seq = new Sequence.OneD();
        for (let j = left; j < warps(draft.drawdown) - right; j++) {
            seq.push(getHeddle(draft.drawdown, i, j));
        }
        pattern.pushWeftSequence(seq.val());
        weft_materials.push(draft.rowShuttleMapping[i])
        weft_systems.push(draft.rowSystemMapping[i])

    }

    for (let j = left; j < warps(draft.drawdown) - right; j++) {
        warp_mats.push(draft.colShuttleMapping[j])
        warp_systems.push(draft.colSystemMapping[j])
    }


    const d = initDraftFromDrawdown(pattern.export());
    d.colShuttleMapping = warp_mats.val();
    d.colSystemMapping = warp_systems.val();
    d.rowShuttleMapping = weft_materials.val();
    d.rowSystemMapping = weft_systems.val();


    return Promise.resolve([d]);

};


const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {

    const r = getAllDraftsAtInlet(op_inputs, 0);
    const name_list = parseDraftNames(r);
    return 'trim(' + name_list + ")";
}


export const trim: Operation = { name, old_names, params, inlets, perform, generateName };

