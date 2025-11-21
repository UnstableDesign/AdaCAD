import { initDraftWithParams, createCell } from "../../draft";
import { getOpParamValById } from "../../operations";
import { StringParam, OperationInlet, OpParamVal, Operation, OpMeta } from "../types";
import { parseRegex } from "../../utils";
import { colorEffectsOp } from "../categories";

const name = "material_sequence";


const meta: OpMeta = {
    displayname: 'create material sequence',
    desc: 'use a list of numbers to create a sequence of materials',
    img: 'material_sequence.png',
    categories: [colorEffectsOp],
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
    dx: 'creates a draft with weft materials specified by the number sequence'
};




const params = [sequence_pattern];


const inlets: Array<OperationInlet> = [];


const perform = (param_vals: Array<OpParamVal>) => {


    const sequence_string: string = <string>getOpParamValById(0, param_vals);

    const regex_matches = parseRegex(sequence_string, sequence_pattern.regex)


    const sequence_array = regex_matches
        .filter(el => el !== ' ')
        .map(el => parseInt(el))


    const draft = initDraftWithParams({
        wefts: 1,
        warps: sequence_array.length,
        drawdown: [[createCell(false)]],
        colSystemMapping: sequence_array
    })



    return Promise.resolve([{ draft }]);

}


const generateName = (param_vals: Array<OpParamVal>): string => {
    return 'material sequence(' + param_vals[0].val + ')';
}



export const material_sequence: Operation = { name, meta, params, inlets, perform, generateName };



