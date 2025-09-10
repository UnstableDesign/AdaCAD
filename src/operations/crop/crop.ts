import { Draft, wefts, initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation } from "../types";

const name = "crop";
const old_names: Array<string> = [];


//PARAMS
const starting_ends: NumParam =
{
    name: 'ends from start',
    type: 'number',
    min: 0,
    max: 10000,
    value: 0,
    dx: 'number of pics from the origin to start the cut'
}

const staring_pics: NumParam = {
    name: 'pics from start',
    min: 0,
    max: 10000,
    value: 0,
    type: 'number',
    dx: 'number of ends from the origin to start the cut'
}

const width: NumParam =
{
    name: 'width',
    type: 'number',
    min: 1,
    max: 10000,
    value: 10,
    dx: 'total width of cutting box'
}

const height: NumParam =
{
    name: 'height',
    type: 'number',
    min: 1,
    max: 10000,
    value: 10,
    dx: 'height of the cutting box'
}






const params = [starting_ends, staring_pics, width, height];

//INLETS
const draft: OperationInlet = {
    name: 'draft',
    type: 'static',
    value: null,
    dx: 'the draft to crop',
    uses: "draft",
    num_drafts: 1
}



const inlets = [draft];


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<Draft>> => {

    const draft = getInputDraft(op_inputs);
    const left: number = <number>getOpParamValById(0, op_params);
    const top: number = <number>getOpParamValById(1, op_params);
    const width: number = <number>getOpParamValById(2, op_params);
    const height: number = <number>getOpParamValById(3, op_params);


    if (draft == null) return Promise.resolve([]);

    const warp_systems = new Sequence.OneD(draft.colSystemMapping).shift(left).resize(width);
    const warp_mats = new Sequence.OneD(draft.colShuttleMapping).shift(left).resize(width);
    const weft_systems = new Sequence.OneD(draft.rowSystemMapping).shift(top).resize(height);
    const weft_materials = new Sequence.OneD(draft.rowShuttleMapping).shift(top).resize(height);

    const pattern = new Sequence.TwoD();

    //start with starting pics
    for (let i = 0; i < height; i++) {

        const seq = new Sequence.OneD();
        const adj_i = i + top;
        if (adj_i >= wefts(draft.drawdown)) {
            seq.pushMultiple(2, width);
        } else {

            const row = (draft.drawdown[adj_i].length > left) ? draft.drawdown[adj_i].slice(left) : [];
            seq.pushRow(row);
            const diff = width - row.length;
            if (diff > 0) seq.pushMultiple(2, diff);
            if (diff < 0) {
                seq.resize(width);
            }
        }

        pattern.pushWeftSequence(seq.val())

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
    return 'crop(' + name_list + ")";
}


export const crop: Operation = { name, old_names, params, inlets, perform, generateName };

