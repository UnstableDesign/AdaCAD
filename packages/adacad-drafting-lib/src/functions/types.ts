import { OpInletValType } from "../operations/types"

export type LiveFunction = {
    name: string,
    inlets: Array<FunctionInlet>,
    meta: FunctionMeta,
    compute: (inputs: Array<OpInletValType>) => Promise<Array<FunctionOutput>>,
}

export type FunctionInlet = {
    name: string,
    type: 'number',
    dx: string,
    value: number,
    num_inputs: number
}

export type FunctionMeta = {
    displayname: string,
    desc: string,
}

export type FunctionOutput = {
    type: 'number',
    value: number,
}