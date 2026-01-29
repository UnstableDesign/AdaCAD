import { Drawdown, InterlacementVal } from "../draft/types";


/**
 * a loom is just a threading, tieup, and treadling
 */
export type Loom = {
  threading: Array<number>,
  tieup: Array<Array<boolean>>,
  treadling: Array<Array<number>>
}

/**
 * this keeps any user defined preferences associated with a given loom
 * @param type the type of loom to use for computations (currently only supporting jacquard, direct tieup/dobby looms, floor looms with shafts and treadles)
 * @param epi the ends for unit length to use for calculations
 * @param ppi the picks for unit length to use for calculations
 * @param units the units to use for length, currently supports inches (1 inch), or centimeters (10cm)
 * @param frames the number of frames the user has specified as the max for their loom
 * @param treadles the number of treadles the user has specified as the max for their loom or -1, if they have no limit
 */
export type LoomSettings = {
  type: string,
  epi: number,
  ppi: number,
  units: 'cm' | 'in',
  frames: number,
  treadles: number,
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
  computeLoomFromDrawdown?: (d: Drawdown, loom_settings: LoomSettings) => Promise<Loom>,
  computeDrawdownFromLoom?: (l: Loom) => Promise<Drawdown>,
  recomputeLoomFromThreadingAndDrawdown?: (l: Loom, loom_settings: LoomSettings, d: Drawdown) => Promise<Loom>,
  updateThreading?: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTreadling?: (l: Loom, ndx: InterlacementVal) => Loom,
  updateTieup?: (l: Loom, ndx: InterlacementVal) => Loom,
  insertIntoThreading?: (l: Loom, j: number, val: number) => Loom,
  insertIntoTreadling?: (l: Loom, i: number, val: Array<number>) => Loom,
  deleteFromThreading?: (l: Loom, j: number) => Loom,
  deleteFromTreadling?: (l: Loom, i: number) => Loom,
  pasteThreading?: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number) => Loom,
  pasteTreadling?: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number) => Loom,
  pasteTieup?: (l: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number) => Loom,
  getDressingInfo: (dd: Drawdown, l: Loom, ls: LoomSettings) => Array<{ label: string, value: string }>;
}

