import { Draft } from "../draft/types";
import { Loom, LoomSettings } from "../loom";
import { Img } from "../media/types";


/**
 * an object that represents a possible categorization for an operation
 */
export type OpCategory = {
  name: string,
  displayname: string,
  color: string,
  desc: string,
  url?: string
};

export type OpLink = {
  url: string,
  text: string
}


/**
 * meta data fields for operations
 */
export type OpMeta = {
  displayname: string,
  desc: string,
  categories: Array<OpCategory>,
  img?: string,
  advanced?: boolean,
  draft?: boolean,
  deprecated?: boolean,
  old_names?: Array<string>,
  authors?: Array<string>,
  urls?: Array<OpLink>
}

/**
 * a standard opearation
 * @param name the internal name of this opearation (CHANGING THESE WILL BREAK LEGACY VERSIONS)
 * @param displayname the name to show upon this operation in the interface
 * @param dx the description of this operation
 * @param params the parameters associated with this operation
 * @param inets the inlets associated with this operation
 * @param old_names refers to any prior name of this operation to aid when loading old files
 * @param perform a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts
 * @param generateName a function that computes the system provided name default based on the inputs. a number can be passed in args to handle cases where the operation needs to assign different names to different draft outputs
 */
export type Operation = {
  name: string,
  params: Array<OperationParam>,
  inlets: Array<OperationInlet>,
  meta: OpMeta,
  perform: (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>) => Promise<Array<OpOutput>>,
  generateName: (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>) => string
}

/**
* A container operation that takes drafts with some parameter assigned to them 
* @param dynamic_param_id which parameter ids should we use to determine the number and value of parameterized input slots
* @param dynamic_inlet_type dynamic parameters convert parameter inputs to inlets of a given type, this specifies the type of inlet created
* @param onParamChange a function that executes when a dynamic parameter is changed and returns the values for the inlets
*/
export type DynamicOperation = Operation & {
  dynamic_param_id: number,
  dynamic_param_type: 'number' | 'notation' | 'system' | 'color' | 'static' | 'draft' | 'profile' | 'null',
  onParamChange: (param_vals: Array<OpParamVal>, static_inlets: Array<OperationInlet>, inlet_vals: Array<OpInletValType>, changed_param_id: number, dynamic_param_val: OpParamValType) => Array<OpInletValType>;
  perform: (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => Promise<Array<OpOutput>>;
}


/**
 * an operation param describes what data be provided to this operation
 * some type of operations inherent from this to offer more specific validation data 
 */
export type OperationParam = {
  name: string,
  type: 'number' | 'boolean' | 'select' | 'file' | 'string' | 'draft';
  value: OpParamValType,
  dx: string
}



/**
 * An extension of Param that handles extra requirements for numeric data inputs
 * @param min the minimum allowable value
 * @param max the maximum allowable value
 */
export type NumParam = OperationParam & {
  min: number,
  max: number
}



/**
 * An extension of Param that handles extra requirements for select list  inputs
 * @param seleclist an array of names and values from which the user can select
 */
export type SelectParam = OperationParam & {
  selectlist: Array<{ name: string, value: number }>
}

/**
 * An extension of Param that handles extra requirements for select boolean inputs
 * @param falsestate a description for the user explaining what "false" means in this param
 * @param truestate a description for the user explaining what "false" means in this param
 */
export type BoolParam = OperationParam & {
  falsestate: string,
  truestate: string
}

/**
* An extension of Param that handles extra requirements for select file inputs
*/
export type FileParam = OperationParam & {
}

/**
* An extension of Param that handles extra requirements for blocks that interpret code
*/
export type CodeParam = OperationParam & {
  docs: string;
}



/**
* An extension of Param that in intended to shape how inlets parse layer notation to generate inlets
* @param id draft id at this parameter --- unusued currently 
*/
export type NotationTypeParam = OperationParam & {
  falsestate: string,
  truestate: string
}


/**
* An extension of Param that handles extra requirements for strings as inputs
* @param regex strings must come with a regex used to validate their structure
 * test and make regex using RegEx101 website
 * do not use global (g) flag, as it creates unpredictable results in test functions used to validate inputs
@param error the error message to show the user if the string is invalid 
*/
export type StringParam = OperationParam & {
  regex: RegExp,
  error: string
}





/**
 * this containers the parameters associated with the operation
 * @param op_name the name of the operation  input parameter
 * @param params the parameters associated with this operation OR child input
 */
export interface OpParamVal {
  param: OperationParam,
  val: OpParamValType,
}



/**
 * each operation has 0 or more inlets. These are areas where drafts can be entered as inputs to the operation
 * this datatype is intended only to support static inlets that are defined in operations. 
 * @param name the display name to show with this inlet
 * @param type the type of parameter that becomes mapped to inputs at this inlet, static means that the user cannot change this value
 * @param dx the description of this inlet
 * @param uses this is used to alert the user the inforamation from the input this inlet will use, draft or materials. 
 * @param value the assigned value of the parameter. 
 * @param num_drafts the total number of drafts accepted into this inlet (or -1 if unlimited)
 */
export type OperationInlet = {
  name: string,
  type: 'number' | 'notation' | 'system' | 'color' | 'static' | 'draft' | 'profile' | 'null',
  dx: string,
  uses: 'draft' | 'weft-data' | 'warp-data' | 'warp-and-weft-data',
  value: OpInletValType,
  num_drafts: number
}


/**
 * An extension of Inlet that handles extra requirements for numeric data inputs
 * @param value the current (or default?) value of this number input
 * @param min the minimum allowable value
 * @param max the maximum allowable value
 */
export type NumInlet = OperationInlet & {
  value: number,
  min: number,
  max: number
}







export type OpParamValType = number | boolean | string | Img;
export type OpInletValType = number | string | null;



/**
 * this is a type that contains and contextualizes a series of inputs to an operation, each inlet on an operation corresponds to one op input
 * @param drafts the drafts (from zero to multiple) associated with this input
 * @param params the parameters associated with this input
 * @param inlet_id the index of the inlet for which the draft is entering upon
 */
export interface OpInput {
  drafts: Array<Draft>,
  inlet_params: Array<OpInletValType>,
  inlet_id: number
}


/**
 * operations return an array of OpOutputs which need to include a draft (required), and optionally, can return 
 * a loom to associate with this draft, and an error message if something occured when generating this draft
 */
export type OpOutput = {
  draft: Draft,
  loom?: Loom,
  loom_settings?: LoomSettings,
  err?: string
}




/**
 * this type is used to classify operations in the dropdown menu
 * @param category the name of the category for all associated operations (e.g. block, structure)
 * @param dx a description of that category to show on screen
 * @param ops an array of all the operations associated with this category
 */
export interface OperationClassification {
  category_name: string,
  description: string,
  color: string,
  op_names: Array<string>;
}
