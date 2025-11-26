import { initDraftFromDrawdown, Draft } from "../../draft";
import { getOpParamValById } from "..";
import { StringParam, OperationInlet, OpParamVal, Operation, OpMeta, SelectParam } from "../types";
import { defaults, parseRegex } from "../../utils";
import { draftingStylesOp } from "../categories";
import { Sequence } from "../../sequence";

const name = "threading_treadling_sequence";


const meta: OpMeta = {
    displayname: 'treading/threading sequence',
    desc: 'use a list of numbers to create a sequence threading or treadling assignments',
    img: 'draft_sequence.png',
    categories: [draftingStylesOp],
    advanced: true
}


//PARAMS
const sequence_pattern: StringParam =
{
    name: 'sequence',
    type: 'string',
    regex: /\d+|\D+/i,
    value: '1 1 1 2 2 3',
    error: '',
    dx: 'creates a threading or treadling assignments specified by the number sequence'
};

const role: SelectParam = {
    name: 'role',
    type: 'select',
    selectlist: [
        { name: 'threading', value: 0 },
        { name: 'treadling', value: 1 },
        { name: 'both', value: 2 },
    ],
    value: 0,
    dx: 'the role of the sequence'
}




const params = [sequence_pattern, role];


const inlets: Array<OperationInlet> = [];


const perform = (param_vals: Array<OpParamVal>) => {


    const sequence_string: string = <string>getOpParamValById(0, param_vals);
    const role: number = <number>getOpParamValById(1, param_vals);
    const regex_matches = parseRegex(sequence_string, sequence_pattern.regex)


    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el))



    //get the max value in the sequence
    const max = sequence_array.reduce((acc, curr) => {
        acc = Math.max(acc, curr);
        return acc;
    }, 0);



    const base: Array<number> = [];
    for (let i = 0; i < max; i++) {
        base.push(0);
    }


    const treadling_seq = new Sequence.TwoD();
    const threading_seq = new Sequence.TwoD();

    sequence_array.forEach((el) => {
        const row = new Sequence.OneD(base)
        if (el - 1 >= 0) {
            row.set(el - 1, 1);
        }
        treadling_seq.pushWeftSequence(row.val());
        threading_seq.pushWarpSequence(row.val());
    });

    const treadling_draft = initDraftFromDrawdown(treadling_seq.export());
    const threading_draft = initDraftFromDrawdown(threading_seq.export());

    const return_drafts: Array<Draft> = [];

    if (role == 0 || role == 2) {
        return_drafts.push(threading_draft);
    }
    if (role == 1 || role == 2) {
        return_drafts.push(treadling_draft);
    }
    return Promise.resolve(return_drafts.map(el => { return { draft: el } }));


}


const generateName = (param_vals: Array<OpParamVal>): string => {
    return 'threading/treadling sequence(' + param_vals[0].val + ')';
}

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
    const sequence_string: string = <string>getOpParamValById(0, param_vals);
    const regex_matches = parseRegex(sequence_string, sequence_pattern.regex)


    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el))



    //get the max value in the sequence
    const height = sequence_array.reduce((acc, curr) => {
        acc = Math.max(acc, curr);
        return acc;
    }, 0);

    const width = sequence_array.length;

    return (width * height <= defaults.max_area) ? true : false;

}

export const threading_treadling_sequence: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };



