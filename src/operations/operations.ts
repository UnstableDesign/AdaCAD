import { Draft } from "../draft";
import { Operation, OpInput, OpParamVal, OpParamValType } from "./types";


/**
 * a wrapper to simplify how operations are called from within the code. 
 * @param op the operation you are calling
 * @param params the values to associate with each parameter (in the order they are defined). If you define less than what is required, or submit a parameter of the wrong type (e.g. a string instead of a number), it will automatically replace the param with the default value
 * @param inlets the drafts to use in the computation, any values associated with those inputs, as well as the cooresponding id to be associated with the drafts
 * @returns a promise containing an array of drafts
 */
export const call = async (op: Operation, params: Array<OpParamValType>, inlets?: Array<OpInput>): Promise<Array<Draft>> => {

    const formatted_params: Array<OpParamVal> = op.params.map((el, ndx) => {
        if (params[ndx] === null || params[ndx] === undefined || typeof el.value != typeof params[ndx]) {
            return { param: el, val: el.value }
        } else {
            return { param: el, val: params[ndx] }
        }
    })
    return op.perform(formatted_params, inlets ?? []);
}