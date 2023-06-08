import { ViewRef } from "@angular/core";
import { NoteComponent } from "../../mixer/palette/note/note.component";
import { ConnectionComponent } from "../../mixer/palette/connection/connection.component";
import { OperationComponent } from "../../mixer/palette/operation/operation.component";
import { SubdraftComponent } from "../../mixer/palette/subdraft/subdraft.component";
import { MaterialsService } from "../provider/materials.service";
import { Subject } from "rxjs";

/**
 * This file contains all definitions of custom types and objects
 */



/*****   OBJECTS/TYPES RELATED TO DRAFTS  *******/


/**
 * Drawdown can be used as shorthand for drafts, which are just 2D arrays of Cells
 */
export type Drawdown = Array<Array<Cell>>;


/**
 * stores a drawdown along with broader information a draft such
 * @param id a unique id to refer to this draft, used for linking the draft to screen components
 * @param gen_name a automatically generated name for this draft (from parent operation)
 * @param ud_name a user defined name for this draft, which, if it exists, will be used instead of the generated name
 * @param drawdown the drawdown/interlacement pattern used in this draft
 * @param rowShuttleMapping the repeating pattern to use to assign draft rows to shuttles (materials)
 * @param rowSystemMapping the repeating pattern to use to assign draft rows to systems (structual units like layers for instance)
 * @param colShuttleMapping the repeating pattern to use to assign draft columns to shuttles (materials)
 * @param colSystemMapping the repeating pattern to use to assign draft columns to systems (structual units like layers for instance)
 */
export interface Draft{
  id: number,
  gen_name: string,
  ud_name: string,
  drawdown: Drawdown,
  rowShuttleMapping: Array<number>,
  rowSystemMapping: Array<number>,
  colShuttleMapping: Array<number>,
  colSystemMapping: Array<number>,
}

export interface Cell{
  is_set: boolean,
  is_up: boolean
}


export interface System{
  id: number;
  name: string;
  notes: string;
  visible: boolean;
  in_use: boolean;
}



export interface Material {
  id: number;
  name: string;
  insert: boolean; //true is left, false is right
  visible: boolean;
  color: string;
  thickness: number; //percentage of base dims
  type: number;
  diameter: number;
  startLabel?: string;
  endLabel?: string;
  notes: string;

}

/**
 * represents a location within a draft.
 * @param i is the row/weft number (0 being at the top of the drawdown)
 * @param j is the column/warp number (0 being at the far left of the drawdown)
 * @param si is the location of this cell within the current view (where the view may be hiding some rows)
 *        this value can be de-indexed to absolute position in the rows using draft.visibleRows array
 * @example const i: number = draft.visibleRows[si];
 */
 export interface Interlacement {
  i: number;  
  j: number;  
  si: number; 
}

/**
 * represents a location within a draft as well as the value to be placed at that location
 * used by Loom to stage updates before settting them
 * @param i is the row/weft number (0 being at the top of the drawdown)
 * @param j is the column/warp number (0 being at the far left of the drawdown)
 * @param val the value to be assigned at the given location
 */

 export interface InterlacementVal {
  i: number;  
  j: number 
  val: boolean; 
}


/***** OBJECTS/TYPES RELATED TO MIXER COMPONENTS ****/

/**
 * this stores a list of drafts created with associated component ids for those drafts, 
 * or -1 if the component for this draft has not been generated yet. 
 */
 export interface DraftMap{
  component_id: number;
  draft: any;
}


/***** OBJECTS/TYPES RELATED TO SCREEN LAYOUT ****/


/**
 * describes a point using x,y coordinates
 * often used for referencing mouse and/or screen drawing positions
 */
 export interface Point {
  x: number;
  y: number;
}

/**
 * Describes a rectangle on the screen.
 * @param topleft - position of this rectanble
 * @param width - the width of the rectangle
 * @param height - the height of this rectanble.
 */
 export interface Bounds {
  topleft: Point;  //row on draft
  width: number;  //column on draft 
  height: number; //corresponding screen row
}

// /**
//  * A type to communicate locations on the loom that have been updated in response to a given action
//  */
// interface LoomUpdate {
//   threading: Array<InterlacementVal>,
//   treadling: Array<InterlacementVal>,
//   tieup: Array<Array<InterlacementVal>>
// }


/****** OBJECTS/TYPES to CONTROL SELECT LISTS******/

export interface LoomTypes {
  value: string;
  viewValue: string;
}

export interface MaterialTypes {
  value: number;
  viewValue: string;
}

export interface DensityUnits {
  value: string;
  viewValue: string;
}

export interface ViewModes {
  value: string;
  viewValue: string;
}


/**
 * Stores the icons and language for determining different 
 * modes within which the mouse points are handled
 * @param value - reference 
 * @param viewValue - text shown to users
 * @param icon
 * @param children, menu to nest within this
 * @param selected boolean to show if it is selected
 */
 export interface DesignMode{
  value: string;
  viewValue: string;
  icon: string;
  children: Array<DesignMode>;
  selected: boolean;
}

export interface Note{
  id: number,
  interlacement: Interlacement; 
  title: string;
  text: string;
  ref: ViewRef;
  color: string;
  component: NoteComponent; 
  imageurl: string;
  width: number;
  height: number;
 }


/**
 * this keeps any user defined preferences associated with a given loom
 * @param type the type of loom to use for computations (currently only supporting jacquard, direct tieup/dobby looms, floor looms with shafts and treadles)
 * @param epi the ends for unit length to use for calcuations
 * @param units the units to use for length, currently supports inches (1 inch), or centimeters (10cm)
 * @param frames the number of frames the user has specified as the max for their loom
 * @param treadles the number of treadles the user has specified as the max for their loom or -1, if they have no limit
 */
 export type LoomSettings = {
  type: string,
  epi: number,
  units: 'cm' | 'in',
  frames: number,
  treadles: number,
}

/**
 * a loom is just a threading, tieup, and treadling
 */
export type Loom = {
  threading: Array<number>,
  tieup: Array<Array<boolean>>,
  treadling: Array<Array<number>>
}



/***
 *  Store each loom type as a different unit that computes functions based on its particular settings
 * @param type an identifer relating to the currently supported types
 * @param displayname the name to show with this loom type
 * @param dx the description for this type of loom
 * @param updateThreading a function to execute when a single cell is modified within the Threading
 * @param updateTreadling a function to execute when a single cell is modified within the Treadling
 * @param updateTieup a function to execute when a single cell is modified within the Tieup
 * @param pasteThreading a function to execute when a single cell is modified within the Threading
 * @param pasteTreadling a function to execute when a single cell is modified within the Treadling
 * @param pasteTieup a function to execute when a single cell is modified within the Tieup
 */
export type LoomUtil = {
  type: 'jacquard' | 'frame' | 'direct',
  displayname: string,
  dx: string,
  computeLoomFromDrawdown: (d:Drawdown, loom_settings: LoomSettings, origin: number) => Promise<Loom>,
  computeDrawdownFromLoom: (l:Loom, origin: number) => Promise<Drawdown>,
  recomputeLoomFromThreadingAndDrawdown:(l:Loom, loom_settings: LoomSettings, d: Drawdown, origin: number) => Promise<Loom>,
  updateThreading: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTreadling: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTieup: (l: Loom, ndx: InterlacementVal)=> Loom,
  insertIntoThreading: (l: Loom, j: number, val: number) => Loom,
  insertIntoTreadling: (l: Loom, i: number, val: Array<number>) => Loom,
  deleteFromThreading: (l: Loom, j: number) => Loom,
  deleteFromTreadling: (l: Loom, i: number) => Loom,
  pasteThreading: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width:number, height: number) => Loom,
  pasteTreadling: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width:number, height: number) => Loom,
  pasteTieup: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width:number, height: number)=> Loom
}


export type YarnMap = Array<Array<Cell>>;


/****** OBJECTS/TYPES FOR LOADING AND SAVING FILES *****/


/**
 * holds data about each node/component in a form to easily load.
 * @param node_id the id of this node within the tree
 * @param type the type of node
 * @param bounds the screen position and size data for this node
 */
export interface NodeComponentProxy{
  node_id: number,
  type: string,
  topleft: Point
 }

/**
 * stores a sparce version of a tree node for easy reloading
 * @param node the node id this treenode refers too
 * @param parent the node id of the parent node for this treenode
 * @param inputs an array of treenode ids for all values coming into this node
 * @param outputs an array of treenode ids for all downstream functions 
 */
 export interface TreeNodeProxy{
  node: number,
  parent: number; 
  inputs: Array<{tn: number, ndx: number}>;
  outputs: Array<{tn: number, ndx: number}>; 
 }

  /**
  * holds data about each draft component in a compressed form 
  * @param draft_id the draft id associated with this node (if available)
 * @param draft_visible a boolean to state if this node is visible or not. 
 * @param draft_name a string representing a user defined name
 * @param draft this will only export if the draft is a seed draft
 * @param loom this will only export if the draft is a seed draft 
 * @param loom_settings the associated loom settings on this node, if present
  */

   export interface DraftNodeProxy{
    node_id: number;
    draft_id: number;
    draft_name: string;
    draft: Draft;
    draft_visible: boolean;
    loom: Loom;
    loom_settings: LoomSettings;
    render_colors: boolean;
   }

 /**
  * a sparce form of an operaction component to use for saving
  * @param node_id the node id this object refers too
  * @param name the name of the operation at this node
  * @param params the list of input parameters to this operation
  * @param inlets the let of inlets and associated values 
  */
 export interface OpComponentProxy{
  node_id: number,
  name: string,
  params: Array<any>, 
  inlets: Array<any>;
 }


 /**
  * describes the data from the workspace that is saved.
  */
 export interface SaveObj{
  version: string,
  workspace: any,
  type: string,
  nodes: Array<NodeComponentProxy>,
  tree: Array<TreeNodeProxy>,
  draft_nodes: Array<DraftNodeProxy>,
  ops: Array<OpComponentProxy>,
  notes: Array<Note>,
  materials: Array<Material>,
  scale: number
 }

export interface FileObj{
 version: string,
 workspace: any,
 filename: string,
 nodes: Array<NodeComponentProxy>,
 treenodes: Array<TreeNodeProxy>,
 draft_nodes: Array<DraftNodeProxy>,
 notes: Array<any>,
 ops: Array<OpComponentProxy>
 scale: number
}

export interface StatusMessage{
  id: number,
  message: string,
  success: boolean
}

export interface LoadResponse{
  data: FileObj,
  id: number,
  name: string, 
  desc: string,
  status: number;
}

export interface Fileloader{
  ada: (filename: string, id: number, desc: string, data: any) => Promise<LoadResponse>,
  paste: (data: any) => Promise<LoadResponse>,
  //wif: (filename: string, data: any) => Promise<LoadResponse>,
  //bmp: (filename: string, data: any) => Promise<LoadResponse>,
  //jpg: (filename: string, data: any) => Promise<LoadResponse>,
  form: (data: any) => Promise<LoadResponse>}

export interface FileSaver{
  ada: (type: string, for_timeline:boolean, current_scale: number) => Promise<{json: string, file: SaveObj}>,
  copy: (include: Array<number>, current_scale: number) => Promise<SaveObj>,
  //wif: (draft: Draft, loom: Loom) => Promise<string>,
  bmp: (canvas: HTMLCanvasElement) => Promise<string>,
  jpg: (canvas: HTMLCanvasElement) => Promise<string>
}


/****************** OBJECTS/TYPES RELATED to OPERATIONS *****************/


/**
 * each operation has 0 or more inlets. These are areas where drafts can be entered as inputs to the operation
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
  uses: 'draft' | 'weft-data' | 'warp-data' | 'warp-and-weft-data' ,
  value: number | string | null,
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




/**
 * an operation param describes what data be provided to this operation
 * some type of operations inherent from this to offer more specific validation data 
 */
export type OperationParam = {
  name: string,
  type: 'number' | 'boolean' | 'select' | 'file' | 'string' | 'draft' | 'notation_toggle';
  value: any,
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
  selectlist: Array<{name: string, value: number}>
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
 export interface OpParamVal{
  param: OperationParam,
  val: any
 }


 /**
  * this is a type that contains and contextualizes a series of inputs to an operation, each inlet on an operation corresponds to one op input
  * @param drafts the drafts (from zero to multiple) associated with this input
  * @param params the parameters associated with this input
  * @param inlet_id the index of the inlet for which the draft is entering upon
  */
  export interface OpInput{
    drafts: Array<Draft>,
    params: Array<any>,
    inlet_id: number
   }
  
/**
 * a standard opeartion
 * @param name the internal name of this opearation (CHANGING THESE WILL BREAK LEGACY VERSIONS)
 * @param displayname the name to show upon this operation in the interface
 * @param dx the description of this operation
 * @param params the parameters associated with this operation
 * @param inets the inlets associated with this operation
 * @param old_names referes to any prior name of this operation to aid when loading old files
 * @param perform a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts
 * @param generateName a function that computes the system provided name default based on the inputs
 */
export type Operation = {
    name: string,
    params: Array<OperationParam>,
    inlets: Array<OperationInlet>,
    old_names: Array<string>,
    perform: (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>) => Promise<Array<Draft>>,
    generateName: (op_settings: Array<OpParamVal>, op_inputs: Array<OpInput>) => string
 }

 /**
 * A container operation that takes drafts with some parameter assigned to them 
 * @param dynamic_param_id which parameter id should we use to dynamically create paramaterized input slots
 * @param dynamic_param_type the type of parameter that we look to generate
 * @param onParamChange a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts
 */
export type DynamicOperation = Operation &  {
  dynamic_param_id: number,
  dynamic_param_type: string,
  onParamChange: ( param_vals: Array<OpParamVal>, inlets: Array<OperationInlet>, inlet_vals: Array<any>, changed_param_id: number, param_val: any) => Array<any>;
  perform: (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => Promise<Array<Draft>>;
}



 /**
  * this type is used to classify operations in the dropdown menu
  * @param category the name of the category for all associated operations (e.g. block, structure)
  * @param dx a description of that category to show on screen
  * @param ops an array of all the operations associated with this category
  */
 export interface OperationClassification{
  category_name: string,
  description: string,
  op_names: Array<string>;
 }



 export interface AnalyzedImage{
    id: string,
    name: string,
    data: ImageData, 
    colors: Array<string>,
    colors_to_bw: Array<any>,
    image: HTMLImageElement,
    image_map: Array<Array<number>>,
    width:number,
    height: number,
    type: string,
    warning: string
 }

 export interface Upload {
  $key: string,
  file:File,
  name:string,
  url:string,
  progress:number,
  createdAt: Date,

}



/****************** OBJECTS/TYPES RELATED to OPERATION TREE *****************/


/**
 * this stores a reference to a component on the palette with its id and some
 * @param type is the type of component'
 * @param view_id is ndx to reference to this object in the ViewComponentRef (for deleting)
 * @param id is a unique id linked forever to this component 
 * @param component is a reference to the component object
 * @param dirty describes if this needs to be recalcuated or redrawn 
 */
type BaseNode = {
  type: 'draft' | 'op' | 'cxn',
  ref: ViewRef,
  id: number, //this will be unique for every instance
  component: SubdraftComponent | OperationComponent | ConnectionComponent,
  dirty: boolean
}


/**
 * an OpNode is an extension of BaseNode that includes additional params
 * @param name the name of the operation at this node
 * @param params an array of the current param values at this node
 * @param inlets an array of the inlet values at this node
 */
export type OpNode = BaseNode & {
  name: string,
  params: Array<any>
  inlets: Array<any>;
 }


 /**
 * a DraftNode is an extension of BaseNode that includes additional params
 * @param draft the active draft at this node
 * @param loom the loom associated with the draft at this node
 * @param loom_settings the settings associted with the loom at this node
 */
 export type DraftNode = BaseNode & {
  draft: Draft,
  loom: Loom,
  loom_settings: LoomSettings,
  render_colors: boolean
 }


/**
 * Allows one to use Node as shorthand for any of these types of nodes
 */
 export type Node = BaseNode | OpNode | DraftNode;


 /**
  * a type to store input and output information for nodes that takes multiple node inputs and outputs into account.
  * each node stores the node it gets as input and output and the inlet/outlet that node enter into on itself. 
  * connections will have inlet/outlet indexes of 0, 0 (they cannot connect ot multiple things)
  * drafts will have inset/outout indexes of 0, 0 (they can only have one parent)
  * ops will have multiple inlets and outlets. For example, an input of (2, 1) means that treenode 2 is connected to inlet 1. 
  * @param treenode - the treenode that this input or output goes towards
  * @param ndx - which ndx on the said treenodes does this connect to specifically
  */
 export interface IOTuple{
   tn: TreeNode,
   ndx: number
 }

/**
 * A tree node stores relationships between the components created by operations
  * @param node: is a reference to the node object stored in the tree. 
  * @param parent links to the treenode that "created" this node or null if it was created by the user 
  * @param inputs a list of TreeNodes that are used as input to this TreeNode with an idex to which input they belong to
  * @param outputs a list of TreeNodes created by this node or specified by the user
  * Rules: 
  *   Operations can have many inputs and many outputs 
  *   Subdrafts can only have one input and one output (for now)
  *   
*/
export interface TreeNode{
  node: Node,
  parent: TreeNode,
  inputs: Array<IOTuple>,
  outputs: Array<IOTuple>
}


/****** OBJECTS/TYPES FOR SIMULATING YARN PATHS *****/


/**
 * a yarn cell holds a binary value representing the direction of the weft yarn through the cell. 
 * the binary is organized as NESW and has a 0 if no yarn is at that point, or 1 if there is a yarn at that point
 * for example. 0101 is a weft yarn that travels through the cell, 1100 is a weft yarn that comes in the east (right) size and curves, existing the bottom edge of teh cell
 */
export type YarnCell = number;


/**
 * represts the point of this yarn within the simulation
 */
export type YarnVertex = {
  x: number, 
  y: number, 
  z: number, 
  i: number, 
  j: number};



/**
 * used to calculate arching of floats
 */
export type YarnFloat = {
  heddle: boolean, 
  total_length: number,
  start: number
}





export type YarnSimSettings = {

  warp_sett: number, //the distance between warp center points on the loom
  warp_tension: number, //the tension value of the warp (higher tension, tighter packing)
  fpack: number, //the force exerted by the packing 

}

export type WarpInterlacementTuple = {
  j: number, 
  i_top: number,
  i_bot: number,
  orientation: boolean; //true = black cell over white, false white over black. 
}

export type WeftInterlacementTuple = {
  i: number, 
  j_left: number,
  j_right: number,
  orientation: boolean //true = black left white right 
}

export type InterlacementLayerMap = {
  i: number, 
  j: number,
  layer: number

}

//marks a point of interlacement between wefts and warps
// x -             - x
// - x === true    x - == false
export type TopologyVtx ={
  id: string,
  i_top: number,
  i_bot: number,
  j_left: number,
  j_right: number,
  z_pos: number,
  orientation: boolean;

}

export type WarpRange ={
  j_left: number, 
  j_right: number

}

export type WarpWeftLayerCount = {
  ndx: number, 
  count: number,
  layer: number
}

export type WarpHeight = {
  over: number,
  under: number
}

export type SimulationData = {
  draft: Draft,
  sim: SimulationVars,
  topo: Array<TopologyVtx>,
  vtxs: VertexMaps,
  layer_maps: LayerMaps,
  top: number,
  right: number
};

export type SimulationVars = {
  warp_spacing: number, 
  layer_spacing: number,
  layer_threshold: number,
  max_interlacement_width: number,
  max_interlacement_height: number,
  ms: MaterialsService
}

export type LayerMaps = {
  warp: Array<Array<number>>,
  weft: Array<Array<number>>
}

export type VertexMaps = {
  warps: Array<Array<YarnVertex>>,
  wefts: Array<Array<YarnVertex>>
}


/**** SETTINGS FOR OTHER FEATURES */

export type Example = {
  id: string,
  title: string,
  desc: string
}






