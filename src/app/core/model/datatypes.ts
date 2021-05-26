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

export{
  Point,
  Interlacement,
  InterlacementVal,
  Bounds,
  LoomCoords,
  LoomUpdate
}


