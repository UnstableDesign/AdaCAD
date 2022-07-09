import { ViewRef } from "@angular/core";
import { ConnectionComponent } from "../../mixer/palette/connection/connection.component";
import { OperationComponent } from "../../mixer/palette/operation/operation.component";
import { SubdraftComponent } from "../../mixer/palette/subdraft/subdraft.component";
import { Note } from "../provider/notes.service";
import { Cell } from "./cell";
import { Shuttle } from "./shuttle";

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

/****** OBJECTS/TYPES to CONTROL YARN SIMULATION ******/


/**
 * Used to draw on screen paths, refers to x, y coordiantes relative to the draft simulation
 * Used only in yarn sim
 * @param x - x position rendered as a % of the total width
 * @param y - y position
 */
 export interface Vertex{
  x_pcent: number;
  y: number;
}

/**
 * Used to draw on screen paths, refers to x, y coordiantes relative to the draft simulation
 * Used only in yarn sim
 * @param draft_ndx - the row id within the draft of this yarn
 * @param material_id the material id at this row
 * @param verticies - list of points that form this path
 */
 export interface YarnPath{
  draft_ndx: number;
  material_id: number;
  verticies: Array<Vertex>;
}

/**
 * describes the relationship between weft rows along the same warp
 */
 export type crossType = {t:boolean, b:boolean} |
   {t:null, b:null} | //"FLOAT",
   {t:null, b:true} | //"UNSET_UNDER"
  {t:null, b:false} | //"UNSET_OVER"
  {t:true, b:null} | //"UNDER_UNSET"
  {t:false, b:null} | //"OVER_UNSET"
  {t:false, b:true} | //"OVER_UNDER",
  {t:true, b:false}; //"UNDER_OVER", 


/**
 * A yarn cross describes the relationship betwen two draft cells
 * read from top to bottom. This is used within the sparce 
 * draft representation, stores only "warp" crossings
 */
 export interface Crossing{
  j: number, 
  type: crossType;
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


/**
 * Store each loom type as a different unit that computes functions based on its particular settings
 * 
 */
export type LoomUtil = {
  type: 'jacquard' | 'frame' | 'direct',
  displayname: string,
  dx: string,
  computeLoomFromDrawdown: (d:Drawdown, origin: number) => Promise<Loom>,
  computeDrawdownFromLoom: (l:Loom, origin: number) => Promise<Drawdown>,
  updateThreading: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTreadling: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTieup: (l: Loom, ndx: InterlacementVal)=> Loom
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
  bounds: Bounds; 
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
  * holds data about each draft component in a form to easily load.
  * @param draft_id the draft id associated with this node (if available)
 * @param draft_visible a boolean to state if this node is visible or not. 
 * @param loom the loom on this node, if present
 * @param loom_settings the associated loom settings on this node, if present
  */

   export interface DraftNodeProxy{
    node_id: number;
    draft_id: number;
    draft: Draft;
    draft_visible: boolean;
    loom: Loom,
    loom_settings: LoomSettings;
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
  ops: Array<any>,
  notes: Array<Note>,
  materials: Array<Shuttle>,
  scale: number
 }

export interface FileObj{
 version: string,
 filename: string,
 nodes: Array<NodeComponentProxy>,
 treenodes: Array<TreeNodeProxy>,
 draft_nodes: Array<DraftNodeProxy>,
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
  status: number;
}

export interface Fileloader{
  ada: (filename: string, data: any) => Promise<LoadResponse>,
  //wif: (filename: string, data: any) => Promise<LoadResponse>,
  //bmp: (filename: string, data: any) => Promise<LoadResponse>,
  //jpg: (filename: string, data: any) => Promise<LoadResponse>,
  form: (data: any) => Promise<LoadResponse>}

export interface FileSaver{
  ada: (type: string, draft_nodes: Array<DraftNode>, for_timeline:boolean, current_scale: number) => Promise<{json: string, file: SaveObj}>,
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
 * @param value the assigned value of the parameter. 
 * @param num_drafts the total number of drafts accepted into this inlet (or -1 if unlimited)
 */
 export type OperationInlet = {
  name: string,
  type: 'number' | 'notation' | 'system' | 'color' | 'static' | 'draft',
  dx: string,
  value: number | string,
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
  type: 'number' | 'boolean' | 'select' | 'file' | 'string' | 'draft',
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
* Currently a placeholder should extra data be required. 
*/
export type FileParam = OperationParam & {
}

/**
* An extension of Param that handles extra requirements for select drafts as inputs
* @param id draft id at this parameter --- unusued currently 
*/
export type DraftParam = OperationParam & {
  id: number;
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
 * A container operation that takes drafts with some parameter assigned to them 
 * @param name the internal name of this operation used for index (DO NOT CHANGE THESE NAMES!)
 * @param displayname the name to show the viewer 
 * @param params the parameters that one can directly input to the parent
 * @param dynamic_param_id which parameter id should we use to dynamically create paramaterized input slots
 * @param dynamic_param_type the type of parameter that we look to generate
 * @param inlets the inlets available for input by default on this operation
 * @param dx the description of this operation
 * @param old_names referes to any prior name of this operation to aid when loading old files
 * @param perform a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts
 */
export interface DynamicOperation {
  name: string,
  displayname: string,
  params: Array<OperationParam>, 
  dynamic_param_id: number,
  dynamic_param_type: string,
  inlets: Array<OperationInlet>,
  dx: string,
  old_names: Array<string>,
  perform: (op_inputs: Array<OpInput>) => Promise<Array<Draft>>;
}


 /**
  * this is a type that contains a series of smaller operations held under the banner of one larger operation (such as layer)
  * @param op_name the name of the operation or "child" if this is an assignment to an input parameter
  * @param drafts the drafts associated with this input
  * @param params the parameters associated with this operation OR child input
  * @param inlets the index of the inlet for which the draft is entering upon
  */
  export interface OpInput{
    op_name: string,
    drafts: Array<Draft>,
    params: Array<any>,
    inlet: number
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
 */
export interface Operation {
    name: string,
    displayname: string,
    dx: string,
    params: Array<OperationParam>,
    inlets: Array<OperationInlet>,
    old_names: Array<string>,
    perform: (op_inputs: Array<OpInput>) => Promise<Array<Draft>>
 }



 /**
  * this type is used to classify operations in the dropdown menu
  * @param category the name of the category for all associated operations (e.g. block, structure)
  * @param dx a description of that category to show on screen
  * @param ops an array of all the operations associated with this category
  */
 export interface OperationClassification{
  category: string,
  dx: string,
  ops: Array<Operation> 
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
  loom_settings: LoomSettings
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





