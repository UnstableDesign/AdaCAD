
import { evaluate } from "mathjs";
import { getOpParamValById, NumParam, Operation, OperationInlet, OpMeta, OpParamVal, StringParam } from "..";
import { initDraftFromDrawdown } from "../../draft/draft";
import { Sequence } from "../../sequence";
import { defaults } from "../../utils/defaults";
import { structureOp } from "../categories";

const name = "bitfield";

const meta: OpMeta = {
    displayname: 'bitfield',
    advanced: true,
    categories: [structureOp],
    authors: ["Alex McLean"],
    desc: "Creates a structure based on a bitfield function, a mathematical function that uses x/y values to determine which heddles are lifted and lowered. ",
    img: 'bitfield.png',
    draft: true
}


//PARAMS
const warps: NumParam = {
    name: "ends",
    type: "number",
    min: 1,
    max: 128,
    value: 32,
    dx: "Number of warps",
};

const wefts: NumParam = {
    name: "pics",
    type: "number",
    min: 1,
    max: 128,
    value: 32,
    dx: "Number of wefts",
};

const f: StringParam = {
    name: "bitfield function",
    type: "string",
    regex: /.*/,
    error: "Invalid expression",
    value: "(x ^ y) % 3",
    dx: "Maths expression that uses x/y values to return a boolean value for each cell, to make 'bitfield' patterns",
};

const params = [warps, wefts, f];

const inlets: Array<OperationInlet> = [];

const perform = (param_vals: Array<OpParamVal>) => {
    const num_warps: number = getOpParamValById(0, param_vals) as number;
    const num_wefts: number = getOpParamValById(1, param_vals) as number;
    let script: string = getOpParamValById(2, param_vals) as string;

    // Mathjs uses ^ for pow, and ^| for bitwise xor
    // This replaces ^ with ^|, so folks don't have to type the |
    script = script.replace(/\^(?!\|)/, "^|");

    // Evaluate as an expression with mathjs. This could just be done with a javascript eval(), but this is more secure.
    const func = evaluate("f(x, y) = ".concat(script));

    const pattern = new Sequence.TwoD();
    for (let weft = 0; weft < num_wefts; ++weft) {
        const row = new Sequence.OneD();
        for (let warp = 0; warp < num_warps; ++warp) {
            row.push(!!func(warp, weft));
        }
        pattern.pushWeftSequence(row.val());
    }
    return Promise.resolve([{ draft: initDraftFromDrawdown(pattern.export()) }]);
};

const sizeCheck = (param_vals: Array<OpParamVal>): boolean => {
    const cols: number = <number>getOpParamValById(0, param_vals);
    const rows: number = <number>getOpParamValById(1, param_vals);
    return (cols * rows <= defaults.max_area) ? true : false;
}

const generateName = (
    param_vals: Array<OpParamVal>
): string => {
    const num_up: number = getOpParamValById(0, param_vals) as number;
    return num_up + "/bitfield";
};

export const bitfield: Operation = {
    name,
    meta,
    params,
    inlets,
    perform,
    generateName,
    sizeCheck,
};