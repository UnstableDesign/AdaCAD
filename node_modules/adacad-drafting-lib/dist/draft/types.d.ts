/**
 * A draft object contains a set of information that can be used for executing a given design.
 * @param id a unique id to refer to this draft, used for linking the draft to screen components
 * @param gen_name a automatically generated name for this draft
 * @param ud_name a user defined name for this draft
 * @param drawdown the drawdown/interlacement pattern used in this draft (e.g. the black/white grid in traditional weaving)
 * @param rowShuttleMapping the repeating pattern to use to assign draft rows to shuttles (materials)
 * @param rowSystemMapping the repeating pattern to use to assign draft rows to systems (structual units like layers for instance)
 * @param colShuttleMapping the repeating pattern to use to assign draft columns to shuttles (materials)
 * @param colSystemMapping the repeating pattern to use to assign draft columns to systems (structual units like layers for instance)
 * @param notes a user defined notes about this draft
 */
export interface Draft {
    id: number;
    gen_name: string;
    ud_name: string;
    drawdown: Drawdown;
    rowShuttleMapping: Array<number>;
    rowSystemMapping: Array<number>;
    colShuttleMapping: Array<number>;
    colSystemMapping: Array<number>;
    notes?: string;
}
/**
 * A Cell represents a location at which a single warp end and weft pick cross. In AdaCAD, each location in the drawdown can have 3 possible settings, captured by the parameters below
 * @param is_set a boolean to describe if there is a weft at this location. True means that a weft crosses this warp. False mean that no weft crosses the warp. This is useful when specifying partial wefts, such as inlay regions
 * @param is_up a boolean used to describe if the heddle holding the warp at this location is lifted (true) or left lowered (false)
 *
 *  ```ts
 * // A 'heddle up' / 'black' draft cell is stored as
 * const heddle_up:Cell = {is_set: true, is_up:true};
 *
 *  // A 'heddle down' / 'white' draft cell is stored as
 * const heddle_down:Cell = {is_set: true, is_up:false};
 *
 *  // * An unset cell (a location with no weft) should be represented as:
 * const unset_correct:Cell = {is_set: false, is_up:false};
 *
 * // this will also be treated as unset, we try to avoid any cases of this configuration
 * const unset_incorrect:Cell = {is_set: false, is_up:true};
* ```
 */
export interface Cell {
    is_set: boolean;
    is_up: boolean;
}
/**
 * A system is an abstract concept that can describe the behavior of a set of warps and wefts.
 * @param id a numeric id that can used to identify this system
 * @param name a public facing name for this system.
 * @param notes any user supplied notes about this system (no currently used)
 * @param visible used to be used to hide/show different systems based on user desire (no currently used)
 * @param in_use AdaCAD generates a list of systems by default. This flag shows if the system is currently assigned to any drafts.
 */
export interface System {
    id: number;
    name: string;
    notes: string;
    visible: boolean;
    in_use: boolean;
}
/**
 * We use the term "drawdown" to mean any 2D arrangement of cells.
 */
export type Drawdown = Array<Array<Cell>>;
/**
 * A method for locating a cell or value stored in a drawdown
 * @param i is the row/weft number (0 being at the top of the drawdown)
 * @param j is the column/warp number (0 being at the far left of the drawdown)
 */
export interface Interlacement {
    i: number;
    j: number;
}
/**
 * represents a location within a draft as well as the value (stored at that locaiton)
 * @param i is the row/weft number (0 being at the top of the drawdown)
 * @param j is the column/warp number (0 being at the far left of the drawdown)
 * @param val the value to be assigned at the given location. Will be true (for heddle up), false (for heddle down), or null for unset
 */
export interface InterlacementVal {
    i: number;
    j: number;
    val: boolean;
}
export interface SystemList {
    valid: boolean;
    wesy: Array<number>;
    wasy: Array<number>;
}
/**
 * A helper interface that can be passed to on draft creation to apply specific settings.
 * This type will commonly be called when using the InitDraftWithParams function as in:
 *
 *  *
 * ```ts
 * //initialize a 10 x 10 draft with all cells set to heddle down.
 * const draft = initDraftWithParams({wefts: 10, warps: 10, drawdown: [[false]]});
 * ```
 *
 *
 * @param id a unqiue id
 * @param gen_name a generated name for this draft
 * @param ud a user defined name for this draft
 * @param wefts a  number of wefts to be used in this draft, will be used to generate a drawdown of a predefined size
 * @param warps a number of warps to be used in this draft, will be used to generate a drawdown of a predefined size
 * @param drawdown a drawdown to be used in the generated draft. The pattern represented in this value will be repeated over the number of warps and wefts specified.
 * @param pattern support for a legacy format whereby a draft was a 2D array of booleans, instead of a 2D array of cells
 * @param rowShuttleMapping an array representing a sequence of shuttle/mateials ids to be associated with each weft pick.
 * @param colShuttleMapping an array representing a sequence of shuttle/mateials ids to be associated with each warp end.
 * @param rowSystemMapping an array representing a sequence of system ids to be associated with each weft pick.
 * @param colSystemMapping an array representing a sequence of system ids to be associated with each warp end.
 */
export interface InitDraftParams {
    id?: number;
    gen_name?: string;
    ud_name?: string;
    wefts?: number;
    warps?: number;
    drawdown?: Drawdown;
    pattern?: Array<Array<boolean>>;
    rowShuttleMapping?: Array<number>;
    rowSystemMapping?: Array<number>;
    colShuttleMapping?: Array<number>;
    colSystemMapping?: Array<number>;
}
/**
* A helper interface that can be passed to on system creation to apply specific settings.
 */
export interface InitSystemParams {
    id?: number;
    name?: string;
    notes?: string;
    visible?: boolean;
    in_use?: boolean;
}
/**
 * a modified version of the draft that stores the drawdown as a Byte Array to save space
 * note that warp and weft fields are required here as compressed drawdown will be stored as a 1D array.
 */
export interface CompressedDraft {
    id: number;
    gen_name: string;
    ud_name: string;
    warps: number;
    wefts: number;
    compressed_drawdown: Array<number>;
    rowShuttleMapping: Array<number>;
    rowSystemMapping: Array<number>;
    colShuttleMapping: Array<number>;
    colSystemMapping: Array<number>;
}
