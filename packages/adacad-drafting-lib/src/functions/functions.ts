import * as Functions from '../functions/function_list';
import { FunctionInlet, FunctionOutput, LiveFunction } from './types';


export const getFunction = (name: string): LiveFunction | null => {

    const all_funcs = Object.values(Functions);
    const func = all_funcs.find(el => el.name == name)
    return func ?? null;
}

export const getAllFunctions = (): Array<LiveFunction> => {
    const all_funcs = Object.values(Functions);
    return all_funcs;
}

export const call = async (func: LiveFunction, inputs: Array<FunctionInlet>): Promise<Array<FunctionOutput>> => {
    return await func.compute(inputs.map(el => el.value));
}

