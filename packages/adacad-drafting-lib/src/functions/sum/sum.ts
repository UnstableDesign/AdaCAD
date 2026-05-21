import { OpInletValType } from "../../operations/types";
import { FunctionInlet, FunctionMeta, FunctionOutput, LiveFunction } from "../types";

const name = 'sum';

const inlets: Array<FunctionInlet> = [
    { name: 'input', type: 'number', dx: 'the values to add together', value: 0, num_inputs: -1 },
];

const meta: FunctionMeta = {
    displayname: 'sum',
    desc: 'The sum function returns the sum of the input values.',
};

const compute = (inputs: Array<OpInletValType>): Promise<Array<FunctionOutput>> => {

    let sum = 0;
    for (const input of inputs) {
        sum += <number>input;
    }
    return Promise.resolve([{ type: 'number', value: sum }]);

}


export const sum: LiveFunction = {
    name,
    inlets: inlets,
    meta: meta,
    compute: compute,
}