import { Draft } from "../draft";
import { OpCategory, Operation, OpParamValType, OpInput, OpParamVal, OperationInlet, OpInletValType, DynamicOperation, OpOutput } from "./types";
/**
 * generates a list of all the current categorization options for operations.
 * @returns
 */
export declare const opCategoryList: () => Array<OpCategory>;
export declare const getOp: (name: string) => Operation | DynamicOperation | null;
/**
 * returns a list of all the operations that are currently exported in op-list.
 * The operation must not be a draft but it returns it's entire object
 * @param category
 * @returns
 */
export declare const getOpList: (category: string) => Array<Operation | DynamicOperation>;
/**
 * returns a list of every operation that is currently exported in oplist.ts.
 * The operation must not be a draft but it returns it's entire object
 * @param category
 * @returns
 */
export declare const getAllOps: () => Array<Operation | DynamicOperation>;
/**
 * a wrapper to simplify how operations are called from within the code.
 * @param op the operation you are calling
 * @param params the values to associate with each parameter (in the order they are defined). If you define less than what is required, or submit a parameter of the wrong type (e.g. a string instead of a number), it will automatically replace the param with the default value
 * @param inlets the drafts to use in the computation, any values associated with those inputs, as well as the cooresponding id to be associated with the drafts
 * @returns a promise containing an array of drafts
 */
export declare const call: (op: Operation, params: Array<OpParamValType>, inlets?: Array<OpInput>) => Promise<Array<OpOutput>>;
export declare const operationHasInputs: (op_inputs: Array<OpInput>) => boolean;
export declare const getInputDraft: (op_inputs: Array<OpInput>) => Draft | null;
/**
 * in cases where the inlet id's may not directly correspond to values (e.g. layer notation), we may want to retreive all drafts associated with a given string
 * @param op_inputs
 * @param inlet_value
 * @returns
 */
export declare const getAllDraftsAtInletByLabel: (op_inputs: Array<OpInput>, inlet_value: string) => Array<Draft>;
export declare const getAllDraftsAtInlet: (op_inputs: Array<OpInput>, inlet_id: number) => Array<Draft>;
export declare const reduceToStaticInputs: (inlets: Array<OperationInlet>, inlet_vals: Array<OpInletValType>) => Array<OpInletValType>;
/**
 * given the current list of params for an operation, this function concatenates them into a comma separated string of values
 * @param params
 */
export declare const flattenParamVals: (params: Array<OpParamVal>) => string;
export declare const getOpParamValById: (id: number, params: Array<OpParamVal>) => OpParamValType | null;
export declare const getOpParamValByName: (name: string, params: Array<OpParamVal>) => OpParamValType | null;
export declare const parseDraftNames: (drafts: Array<Draft>) => string;
