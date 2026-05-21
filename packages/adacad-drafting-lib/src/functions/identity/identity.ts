import { OpInletValType } from "../../operations/types";
import { FunctionInlet, FunctionMeta, FunctionOutput, LiveFunction } from "../types";

const name = 'identity';

const inlets: Array<FunctionInlet> = [
    { name: 'input', type: 'number', dx: 'the input to the function', value: 0, num_inputs: 1 },
];

const meta: FunctionMeta = {
    displayname: 'identity',
    desc: 'The identity function returns the input value.',
};

const compute = (inputs: Array<OpInletValType>): Promise<Array<FunctionOutput>> => {
    if (inputs.length !== 1) {
        return Promise.reject(new Error('Identity function requires exactly one input'));
    }
    return Promise.resolve([{ type: 'number', value: <number>inputs[0] }]);
}

export const identity: LiveFunction = {
    name,
    inlets: inlets,
    meta: meta,
    compute: compute,
}

