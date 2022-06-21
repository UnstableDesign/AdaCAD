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
  drafts: Array<Draft>,
  looms: Array<Loom>,
  loom_settings: Array<LoomSettings>
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





