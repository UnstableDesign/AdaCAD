import { type } from "os";
import { Cell } from "./cell";

/**
 * describes a point using x,y coordinates
 * often used for referencing mouse and/or screen drawing positions
 */
interface Point {
  x: number;
  y: number;
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


/**
 * returns the assignments of frames and treadles for a given interlacement, as well as the drawdown for context
 */
interface LoomCoords{
  ndx: Interlacement
  frame: number,
  treadle:number,
  drawdown: Array<Array<Cell>>
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

/**
 * A type to communicate locations on the loom that have been updated in response to a given action
 */
interface LoomUpdate {
  threading: Array<InterlacementVal>,
  treadling: Array<InterlacementVal>,
  tieup: Array<Array<InterlacementVal>>
}

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
 * this stores a list of drafts created with associated component ids for those drafts, 
 * or -1 if the component for this draft has not been generated yet. 
 */
interface DraftMap{
  component_id: number;
  draft: any;
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




// interface ToolModes{
//   value: string; 
//   viewValue: string;
//   icon: string;
//   menu: string;

// }

export{
  Point,
  Interlacement,
  InterlacementVal,
  Bounds,
  LoomCoords,
  LoomUpdate,
  LoomTypes,
  DensityUnits,
  ViewModes,
  MaterialTypes,
  DraftMap,
  DesignMode,
  Vertex,
  YarnPath,
  crossType,
  Crossing
}


