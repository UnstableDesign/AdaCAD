import { Draft, getDraftName } from "../draft";
import { clothOp, colorEffectsOp, compoundOp, computeOp, dissectOp, draftingStylesOp, helperOp, structureOp, transformationOp } from "./categories";
import { OpCategory, Operation, OpParamValType, OpInput, OpParamVal, OperationInlet, OpInletValType, DynamicOperation, OpOutput } from "./types";
import * as Operations from '../operations/operation_list';


/**
 * generates a list of all the current categorization options for operations. 
 * @returns 
 */
export const opCategoryList = (): Array<OpCategory> => {

    return [
        structureOp,
        transformationOp,
        clothOp,
        compoundOp,
        dissectOp,
        computeOp,
        helperOp,
        colorEffectsOp,
        draftingStylesOp
    ]
}


export const getOp = (name: string): Operation | DynamicOperation | null => {

    const all_objs = Object.values(Operations);
    const published_ops = all_objs.filter(el => el.meta.draft === undefined);
    const op = published_ops.find(el => el.name == name)
    return op ?? null;
}


/**
 * returns a list of all the operations that are currently exported in op-list. 
 * The operation must not be a draft but it returns it's entire object
 * @param category 
 * @returns 
 */

export const getOpList = (category: string): Array<Operation | DynamicOperation> => {

    const all_objs = Object.values(Operations);
    const published_ops = all_objs.filter(el => el.meta.draft === undefined);
    const category_ops: Array<Operation | DynamicOperation> = published_ops.filter(op => {
        const obj = op.meta.categories.find(cat => cat.name == category);
        return (obj !== undefined);
    }, []);
    return category_ops;
}


/**
 * returns a list of every operation that is currently exported in oplist.ts. 
 * The operation must not be a draft but it returns it's entire object
 * @param category 
 * @returns 
 */

export const getAllOps = (): Array<Operation | DynamicOperation> => {

    const all_objs = Object.values(Operations);
    const published_ops = all_objs.filter(el => el.meta.draft === undefined);
    return published_ops;
}



/**
 * a wrapper to simplify how operations are called from within the code. 
 * @param op the operation you are calling
 * @param params the values to associate with each parameter (in the order they are defined). If you define less than what is required, or submit a parameter of the wrong type (e.g. a string instead of a number), it will automatically replace the param with the default value
 * @param inlets the drafts to use in the computation, any values associated with those inputs, as well as the cooresponding id to be associated with the drafts
 * @returns a promise containing an array of drafts
 */
export const call = async (op: Operation, params: Array<OpParamValType>, inlets?: Array<OpInput>): Promise<Array<Draft> | Array<OpOutput>> => {

    const formatted_params: Array<OpParamVal> = op.params.map((el, ndx) => {
        if (params[ndx] === null || params[ndx] === undefined || typeof el.value != typeof params[ndx]) {
            return { param: el, val: el.value }
        } else {
            return { param: el, val: params[ndx] }
        }
    })
    return op.perform(formatted_params, inlets ?? []);
}


export const operationHasInputs = (op_inputs: Array<OpInput>): boolean => {
    return op_inputs.length > 0;
}


export const getInputDraft = (op_inputs: Array<OpInput>): Draft | null => {
    if (!operationHasInputs(op_inputs)) return null;
    else return op_inputs[0].drafts[0];
}


/**
 * in cases where the inlet id's may not directly correspond to values (e.g. layer notation), we may want to retreive all drafts associated with a given string
 * @param op_inputs 
 * @param inlet_value 
 * @returns 
 */
export const getAllDraftsAtInletByLabel = (op_inputs: Array<OpInput>, inlet_value: string): Array<Draft> => {

    if (!operationHasInputs(op_inputs) || inlet_value === '') return [];
    else {

        let input_id = -1;
        op_inputs.forEach((input, ndx) => {

            //includes handles the case that occured between version where paranthesis were stripped
            const found = input.inlet_params.findIndex(p => inlet_value.includes(<string>p));
            if (found !== -1) input_id = ndx;
        })

        if (input_id == -1) return [];



        return op_inputs[input_id].drafts;
    }
}



export const getAllDraftsAtInlet = (op_inputs: Array<OpInput>, inlet_id: number): Array<Draft> => {
    if (!operationHasInputs(op_inputs) || inlet_id < 0) return [];
    else {

        const req_inputs: Array<OpInput> = op_inputs.filter(el => el.inlet_id == inlet_id);

        const drafts: Array<Draft> = req_inputs.reduce((acc: Array<Draft>, el) => {
            return acc.concat(el.drafts);
        }, []);


        return drafts;
    }
}




const returnDefaultValue = (p: OpParamVal): OpParamValType | null => {
    switch (p.param.type) {
        case 'boolean':
            return false;

        case 'draft':
            return null;

        case 'file':
            return null;

        case 'notation_toggle':
            return false;

        case 'number':
            return 0;

        case 'select':
            return null;

        case 'string':
            return '';

        default:
            return null;
    }
}

export const reduceToStaticInputs = (inlets: Array<OperationInlet>, inlet_vals: Array<OpInletValType>): Array<OpInletValType> => {

    const static_inputs = inlets.filter(el => el.type === 'static');
    inlet_vals = inlet_vals.slice(0, static_inputs.length);

    return inlet_vals;

}


// export const getOpParamValByName = (name: string, params: Array<OpParamVal>): OpParamVal | null => {
//     if (params.length == 0) return null;

//     const item = params.find(el => el.param.name == 'name');
//     if (item == undefined) {
//         console.error("CANNOT FIND OPERATION PARAMETER WITH NAME ", name);
//         return returnDefaultValue(params[0])
//     }

//     return item;


// }



/**
 * given the current list of params for an operation, this function concatenates them into a comma separated string of values
 * @param params 
 */
export const flattenParamVals = (params: Array<OpParamVal>): string => {
    return params.map(p => p.val).join(',');
}



//TO DO, these are returning different values (one returns the val, and the other returns the type, see if /where this causes errors)
export const getOpParamValById = (id: number, params: Array<OpParamVal>): OpParamValType | null => {

    if (params.length == 0) return null;

    if (id < params.length) {
        return params[id].val;
    } else {
        console.error("PARAM ID ", id, " NOT FOUND IN PARAMS ", params)
        return returnDefaultValue(params[0]);
    }
}

export const getOpParamValByName = (name: string, params: Array<OpParamVal>): OpParamValType | null => {
    if (params.length == 0) return null;

    const item = params.find(el => el.param.name == 'name');
    if (item == undefined) {
        console.error("CANNOT FIND OPERATION PARAMETER WITH NAME ", name);
        return returnDefaultValue(params[0])
    }

    return item.val;


}


export const parseDraftNames = (drafts: Array<Draft>): string => {

    if (drafts.length == 0) return '';



    const flat_names = drafts.reduce((acc, el) => {
        return acc + "+" + getDraftName(el);
    }, '');

    return flat_names.substring(1);

}


