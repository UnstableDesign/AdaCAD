import { Cell } from "./cell";


/*****   OBJECTS/TYPES RELATED TO DRAFTS  *******/


/**
 * Drawdown can be used as shorthand for drafts, which are just 2D arrays of Cells
 */
type Drawdown = Array<Array<Cell>>;


/**
 * stores a drawdown along with broader information a draft such
 * @param id a unique id to refer to this draft, used for linking the draft to screen components
 * @param gen_name a automatically generated name for this draft (from parent operation)
 * @param ud_name a user defined name for this draft, which, if it exists, will be used instead of the generated name
 * @param drawdown the drawdown/interlacement pattern used in this draft
 * @param rowShuttlePattern the repeating pattern to use to assign draft rows to shuttles (materials)
 * @param rowSystemPattern the repeating pattern to use to assign draft rows to systems (structual units like layers for instance)
 * @param colShuttlePattern the repeating pattern to use to assign draft columns to shuttles (materials)
 * @param colSystemPattern the repeating pattern to use to assign draft columns to systems (structual units like layers for instance)
 */
export interface Draft{
  id: number,
  gen_name: string,
  ud_name: string,
  drawdown: Drawdown,
  rowShuttlePattern: Array<number>,
  rowSystemPattern: Array<number>,
  colShuttlePattern: Array<number>,
  colSystemPattern: Array<number>,
}

/**
 * represents a location within a draft.
 * @param i is the row/weft number (0 being at the top of the drawdown)
 * @param j is the column/warp number (0 being at the far left of the drawdown)
 * @param si is the location of this cell within the current view (where the view may be hiding some rows)
 *        this value can be de-indexed to absolute position in the rows using draft.visibleRows array
 * @example const i: number = draft.visibleRows[si];
 */
 interface Interlacement {
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

 interface InterlacementVal {
  i: number;  
  j: number 
  val: boolean; 
}


/***** OBJECTS/TYPES RELATED TO MIXER COMPONENTS ****/

/**
 * this stores a list of drafts created with associated component ids for those drafts, 
 * or -1 if the component for this draft has not been generated yet. 
 */
 interface DraftMap{
  component_id: number;
  draft: any;
}


/***** OBJECTS/TYPES RELATED TO SCREEN LAYOUT ****/


/**
 * describes a point using x,y coordinates
 * often used for referencing mouse and/or screen drawing positions
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Describes a rectangle on the screen.
 * @param topleft - position of this rectanble
 * @param width - the width of the rectangle
 * @param height - the height of this rectanble.
 */
interface Bounds {
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

interface LoomTypes {
  value: string;
  viewValue: string;
}

interface MaterialTypes {
  value: number;
  viewValue: string;
}

interface DensityUnits {
  value: string;
  viewValue: string;
}

interface ViewModes {
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
interface DesignMode{
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
 interface Vertex{
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
 interface YarnPath{
  draft_ndx: number;
  material_id: number;
  verticies: Array<Vertex>;
}

/**
 * describes the relationship between weft rows along the same warp
 */
type crossType = {t:boolean, b:boolean} |
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
interface Crossing{
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
  computeLoomFromDrawdown: (d:Draft) => Promise<Loom>,
  computerDrawdownFromLoom: (l:Loom) => Promise<Draft>,
  updateThreading: (ndx: Interlacement, l: Loom) => Loom,
  updateTreadling: (ndx: Interlacement, l: Loom) => Loom,
  updateTieup: (ndx: Interlacement, l:Loom)=> Loom
}


export{
  Point,
  Interlacement,
  InterlacementVal,
  Bounds,
  LoomTypes,
  DensityUnits,
  ViewModes,
  MaterialTypes,
  DraftMap,
  DesignMode,
  Vertex,
  YarnPath,
  crossType,
  Crossing,
  Drawdown,
  Loom,
  LoomSettings,
  LoomUtil
}


