import { Drawdown, InterlacementVal, Interlacement } from "../draft";
import { Loom, LoomSettings, LoomUtil } from "./types";
/*********** GENERIC FUNCTIONS RELATING TO LOOMS AND LOOM UTILS ************/
/**
 * creates an empty loom of the size specified. Mostly used for testing.
 * @param warps
 * @param wefts
 * @param frames
 * @param treadles
 * @returns
 */
export declare const initLoom: (warps: number, wefts: number, frames: number, treadles: number) => Loom;
export declare const copyLoom: (l: Loom) => Loom | null;
export declare const copyLoomSettings: (ls: LoomSettings) => LoomSettings;
export declare const convertEPItoMM: (ls: LoomSettings) => number;
export declare const calcWidth: (drawdown: Drawdown, loom_settings: LoomSettings) => number;
export declare const calcLength: (drawdown: Drawdown, loom_settings: LoomSettings) => number;
export declare const convertLoom: (drawdown: Drawdown, l: Loom, from_ls: LoomSettings, to_ls: LoomSettings) => Promise<Loom | null>;
/*** SHARED FUNCTIONS USED WHEN COMPUTING LOOM STATESs ********/
export declare const pasteDirectAndFrameThreading: (loom: Loom, drawdown: Drawdown, ndx: InterlacementVal, width: number, height: number) => Loom;
/**
 * computes the drawdown based on a given loom configuration
 * @param loom
 * @returns the resulting drawdown
 */
export declare const computeDrawdown: (loom: Loom) => Promise<Drawdown>;
/**
* generates a threading based on the provided drawdown
 * @param drawdown the drawdown to use
 * @returns an object containing the threading pattern and the number of frames used
 */
export declare const generateThreading: (drawdown: Drawdown) => Promise<{
    threading: Array<number>;
    num: number;
}>;
/**
 * This function sets the treadling based on a adjusted pattern (e.g. a pattern that has been flipped based on the users selected origin point)
 * @param pattern the drawdown to use to generate the treadling
 * @returns an object containing the treadling and the total number of treadles used
 */
export declare const generateTreadlingforFrameLoom: (pattern: Drawdown) => Promise<{
    treadling: Array<Array<number>>;
    num: number;
}>;
/**
 * generates a direct tieup for the give size
 * @param size the number of frames and treadles
 * @returns a tieup pattern of the specified size
 */
export declare const generateDirectTieup: (size: number) => Array<Array<boolean>>;
/**
 * flips the draft horizontally and/or vertically. Used to flip the draft so that (0,0) is in the top left, no matter which origin point is selected
 * @param d the pattern to flip
 * @param horiz do horizontal flip?
 * @param vert do vertical flip?
 * @returns the flipped pattern
 */
/**
 * calls the series of functions required to flip the looms to common origin based of user selected origin.
 * @param loom the original loom
 * @returns the flipped loom
 */
export declare const flipLoom: (loom: Loom) => Promise<Loom>;
/**
 * flips the threading order so that what was leftmost becomes rightmost
 * @param threading
 * @returns the flipped threading order
 */
export declare const flipThreading: (threading: Array<number>) => Promise<Array<number>>;
/**
* flips the threading order so that what was leftmost becomes rightmost
* @param treadling
* @returns the flipped threading order
*/
export declare const flipTreadling: (treadling: Array<Array<number>>) => Promise<Array<Array<number>>>;
/**
 * flips the threading order so that what was leftmost becomes rightmost
 * @param treadling
 * @returns the flipped threading order
 */
export declare const flipTieUp: (tieup: Array<Array<boolean>>, horiz: boolean, vert: boolean) => Promise<Array<Array<boolean>>>;
/**
 * returns the correct loom util object by string
 * @param type the type of loom you are using
 * @returns
 */
export declare const getLoomUtilByType: (type: "frame" | "direct" | "jacquard" | string) => LoomUtil;
/**
 * calculates the total number of frames used in this loom
 * since its called frequently, keep an eye on this to make sure it isn't hanging page loading
 * and/or call it once per needed function (instead of multiple times in one function)
 * @param loom
 * @returns the highest number found in the array
 */
export declare const numFrames: (loom: Loom) => number;
/**
 * calculates the total number of frames used in this loom
 * since its called frequently, keep an eye on this to make sure it isn't hanging page loading
 * @param loom
 * @returns the highest number found in the array
 */
export declare const numTreadles: (loom: Loom) => number;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export declare const isInThreadingRange: (loom: Loom, ndx: Interlacement) => boolean;
/**
 * checks if a given interlacement is within the range of the threading specified by the user
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export declare const isInUserThreadingRange: (loom: Loom, loom_settings: LoomSettings, ndx: Interlacement) => boolean;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export declare const isInTreadlingRange: (loom: Loom, ndx: Interlacement) => boolean;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export declare const isInUserTreadlingRange: (loom: Loom, loom_settings: LoomSettings, ndx: Interlacement) => boolean;
/**
 * checks if a given interlacement is within the range of the threading
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export declare const isInTieupRange: (loom: Loom, ndx: Interlacement) => boolean;
/**
 * checks if a given interlacement is within the range of the threading including the user defined settings
 * @param loom the loom to check with
 * @param ndx the interlacement to check
 * @returns true or false to determine if in or out of range
 */
export declare const isInUserTieupRange: (loom: Loom, loom_settings: LoomSettings, ndx: Interlacement) => boolean;
/**
 * returns true if this loom typically requires a view of threading and tieup
 */
export declare const isFrame: (loom_settings: LoomSettings) => boolean;
/**
 * assumes the input to the function is a loom of type that uses a tieup and treadling and converts it to a loom that uses a direct tie and lift plan.
 */
export declare const convertTieupToLiftPlan: (loom: Loom, ls: LoomSettings) => Loom;
/**
 * assumes the input to the function is a loom of type that uses a direct tie and lift plan and converts it to a loom that uses a tieup and treadling.
 */
export declare const convertLiftPlanToTieup: (loom: Loom, ls: LoomSettings) => Loom;
