import { Draft, Drawdown } from "../draft";
import { Material } from "../material";
import { CNIndex, ContactNeighborhood, CNType, CNFloat, SimulationVars, WeftPath, YarnVertex, WarpPath, SimulationData, Vec3 } from "./types";
/**
 * Generates all of the data required to simulate this draft.
 * @param draft required - the draft we are going to generate a simulatation from
 * @param simVars required - the variables that will control the simulation
 * @param topo - optional - if we need not recompute the topo, you can supply it.
 * @param wefts - optional - if we need not recompute the wefts, you can supply it.
 * @param warps - optional - if we need not recompute the warps, you can supply it.
 * @returns
 */
export declare const computeSimulationData: (draft: Draft, simVars: SimulationVars, topo?: Array<ContactNeighborhood>, floats?: Array<CNFloat>, wefts?: Array<WeftPath>, warps?: Array<WarpPath>) => Promise<SimulationData>;
export declare const getNodeType: (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) => CNType;
export declare const getLayer: (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) => number;
export declare const layerNotSet: (i: number, j: number, id: number, warps: number, cns: Array<ContactNeighborhood>) => boolean;
/**
 * TODO - update this function to consider layers.
 * uses the contact neighborhoods on this row to get a list of floats. Some floats may be out of range (> warps) in the case where the pattern would repeat and wrap
 * @param i
 * @param warps
 * @param cns
 * @returns
 */
export declare const getRowAsFloats: (i: number, warps: number, cns: Array<ContactNeighborhood>) => Array<CNFloat>;
/**
 * uses the contact neighborhoods on this column to get a list of floats. Some floats may be out of range (> wefts) so that they can readily apply to the edges relationships
 * @param i
 * @param warps
 * @param cns
 * @returns
 */
export declare const getColAsFloats: (j: number, wefts: number, warps: number, cns: Array<ContactNeighborhood>) => Array<CNFloat>;
/**
 * given a point, this function returns the float upon which this point sits
 * @param i any number, will mod by wefts to force in range.
 * @param j any number, will mod by warps to force in range.
 */
export declare const getWeftFloat: (i: number, j: number, wefts: number, warps: number, all_floats: Array<CNFloat>) => CNFloat | null;
/**
 * given a float, check if there are any other floats that share an edge with this float on the row specified by i.
 * @param i
 * @param float
 * @param warps
 * @param all_floats
 * @returns
 */
export declare const getAttachedFloats: (i: number, float: CNFloat, warps: number, all_floats: Array<CNFloat>) => Array<CNFloat>;
/**
 * used when parsing the CN graph, this function looks at the next cell in some direction to determine if it should assign ACNs to any of it's edges.
 * @param i - the row index of the cell at which we are starting the search
 * @param j - the col index of the cell we are starting the search at.
 * @param wefts
 * @param warps
 * @param layer
 * @param direction
 * @param cns
 * @returns
 */
export declare const getNextCellOnLayer: (i: number, j: number, wefts: number, warps: number, layer: number, direction: string, cns: Array<ContactNeighborhood>) => {
    i: number;
    j: number;
} | null;
/**
 * given two faces (assuming two neighboring faces), this function determines what kind of node type should be assigned
 * @param f1 - current face
 * @param f2 - assumes this is "last face", which makes a difference!
 * @param ndx
 * @param warps
 * @param cns
 * @returns
 */
export declare const classifyNodeTypeBasedOnFaces: (f1: boolean | null, f2: boolean | null, ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) => Array<ContactNeighborhood>;
/**
 * given a range in i and/or j this returns any float that has at least part of it within the boundary formed by i and j.
 * @param i  //the l can be less than 0 and r can be greater than wefts
 * @param j
 * @param fs
 */
export declare const getUntouchedFloatsInRange: (i: {
    l: number;
    r: number;
}, j: {
    l: number;
    r: number;
}, all_floats: Array<{
    id: number;
    float: CNFloat;
    touched: boolean;
}>, wefts: number, warps: number) => Array<number>;
/**
 * This function will virtually "lift" the float specified. If this is a warp float, it will find any other warp floats or weft floats that cross over this warp in the range of limit (to the top/bottom) and mark them to be lifted. If it is a weft float, it will find any other weft floats or warp floats that cross over this weft and mark them to be lifted.
 *
 * what happens, however, is as we start separating layers, the floats may "seem" farther apart because there are so many blanks in between. We need some way to 1 to be 1 nearest neighbors instead of 1 cell.
 * @param float
 * @param wefts
 * @param warps
 * @param cns
 * @returns
 */
export declare const getFloatsAffectedByLifting: (id: number, all_floats: Array<{
    id: number;
    float: CNFloat;
    touched: boolean;
}>, wefts: number, warps: number, limit: number) => number[];
/**
 * given a float "float", this function checks which floats are attached to said float on row i and returns the relationship between the float entered and all of it's attached floats.
 * @param i - the row to check against
 * @param float - the original float we are checking against
 * @param wefts - number of wefts in the draft
 * @param warps - number of warps in the draft
 * @param all_floats -the entire list of floats
 * @param cns - the contact neighborhoods
 * @returns
 */
export declare const getFloatRelationships: (i: number, float: CNFloat, wefts: number, warps: number, all_floats: Array<CNFloat>, cns: Array<ContactNeighborhood>) => Array<{
    kind: string;
    float: CNFloat | null;
}>;
/**
 * creates an empty set of CN's for the given drawdown and then walks through and populates their face and id values.
 * @param dd
 * @returns an initialized list of contact neighborhoods
 */
export declare const initContactNeighborhoods: (dd: Drawdown) => Promise<Array<ContactNeighborhood>>;
/**
 * Y Placement is a function of:
 * t: tautness of insertion weft
 * s: the location of the closest crossing float.
 * d: the density of the warps
 */
export declare const getClosestACNOnWeft: (i: number, ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) => CNIndex | null;
export declare const getAllWeftFloats: (wefts: number, warps: number, cns: Array<ContactNeighborhood>) => Array<CNFloat>;
/**
 * goes through the floats of this draft and determines how they will eventually collide and stack. For single layer drafts, this works using only weft floats.
 * for multilayer drafts it will work for all execpt the last layer, so we need to check the back side too.
 * @param wefts
 * @param warps
 * @param cns
 * @returns
 */
export declare const setFloatBlocking: (wefts: number, warps: number, cns: Array<ContactNeighborhood>) => Array<CNFloat>;
export declare const updateCNs: (cns: Array<ContactNeighborhood>, wefts: number, warps: number, sim: SimulationVars) => Array<ContactNeighborhood>;
export declare const pullRows: (d: Draft, paths: Array<WeftPath>, cns: Array<ContactNeighborhood>) => Array<ContactNeighborhood>;
/** checks this row against the last row of the same material and system type and sees if the edge will interlace. If not, it removes any ACNs that would be pulled out in this pic */
export declare const pullRow: (i: number, wefts: number, warps: number, prev_i_list: Array<number>, cns: Array<ContactNeighborhood>) => Array<ContactNeighborhood>;
export declare const printFloats: (floats: Array<{
    id: number;
    float: CNFloat;
    touched: boolean;
}>) => void;
export declare const getFloats: (wefts: number, warps: number, cns: Array<ContactNeighborhood>) => Array<CNFloat>;
/**
* starting with the longest warp, this function searches for all the floats that would be affected (and then would subsequently affect others, if that warp was lifted) the degree or (height) to which it is lifted is specified by the "lift-limit" param in SimulationVars. This assigns layers sequentially, with 1 meaning it is the top layer (looking down on the cloth from above), 2 is the next layer under, 3 is under 2 and so on. a value of 0 means that that this CN was never visited by the algorithm. This function is called recursively as long as there are still floats to analyze.
* @param wefts
* @param warps
* @param layer
* @param cns
* @param sim
* @returns
*/
export declare const isolateLayers: (wefts: number, warps: number, floats: Array<CNFloat>, layer: number, cns: Array<ContactNeighborhood>, sim: SimulationVars) => Array<ContactNeighborhood>;
/**
 * update this to contact neighborhood
 */
export declare const getDraftTopology: (draft: Draft, sim: SimulationVars) => Promise<Array<ContactNeighborhood>>;
/**
 * center the x on the warp
 * @param vtx
 * @param j
 * @param d
 * @returns
 */
export declare const calcX: (vtx: Vec3, j: number, d: number) => Vec3;
/**
 * computes the distance the beat will push the yarn based on the strength of the beat.
 * @param beat_strength - the strength of the beat (0-1)
 * @returns the distance the beat will push the yarn
 */
export declare const getBeatDistance: (beat_strength: number) => number;
/**
 *
 * @param warps
 * @param wefts
 * @param blocking_floats
 * @param vtx_list
 * @returns
 */
export declare const hasBlockingVtx: (warps: number, wefts: number, blocking_floats: Array<CNFloat>, vtx_list: Array<YarnVertex>) => boolean;
export declare const getMaterialFromPath: (i: number, paths: Array<WeftPath>, sim: SimulationVars) => Material | null;
export declare const getYarnHeightOffset: (blocking_i: number, paths: Array<WeftPath>, sim: SimulationVars) => number;
/**
 * finds the left edge of this float in the vertex list. Checks to make sure that the vertex is in range and that the vertex that matches is not a virtual vertex.
 * @param float
 * @param warps
 * @param wefts
 * @param vtx_list
 * @returns
 */
export declare const getFloatVtxLeft: (float: CNFloat, warps: number, wefts: number, vtx_list: Array<YarnVertex>) => YarnVertex | null;
/**
 * finds the left edge of this float in the vertex list. Checks to make sure that the vertex is in range and that the vertex that matches is not a virtual vertex.
 * @param float
 * @param warps
 * @param wefts
 * @param vtx_list
 * @returns
 */
export declare const getFloatVtxRight: (float: CNFloat, warps: number, wefts: number, vtx_list: Array<YarnVertex>) => YarnVertex | null;
export declare const getBlockingVtx: (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, vtx_list: Array<YarnVertex>) => YarnVertex | null;
/**
 * computes the y value of the highest vertex of the blocking floats.
 * it is possible for the blocking float to not have been added yet, for instance, if the float is wrapping. In that case, this function returns
 * @param warps
 * @param wefts
 * @param blocking_floats
 * @param vtx_list
 * @returns
 */
export declare const getYOfBlockingVtx: (blocking_vtx: YarnVertex | null, paths: Array<WeftPath>, sim: SimulationVars, verbose: boolean) => number;
/**
 * assume the ACNs are repelling magnets and compute how far the vertex would be pushed by the force of the closest ACN.
 * @param x
 * @param width
 * @param spacing
 * @param float
 * @param all_floats
 * @param vtx_list
 * @returns
 */
export declare const getRepelForceAtVtx: (vtx: Vec3, blocking_vtx: YarnVertex | null, verbose: boolean) => number;
/**
 * calculates the distance the vertex will be pushed by the force of the closest ACN.
 * @param force_repel
 * @returns
 */
export declare const calculateYRepel: (force_repel: number, time: number, mass: number, verbose: boolean) => number;
export declare const getBlockingFloatsForACN: (warps: number, float: CNFloat, all_floats: Array<CNFloat>) => Array<CNFloat>;
export declare const getVertexForCN: (ndx: CNIndex, vtx_list: Array<YarnVertex>) => YarnVertex | null;
export declare const calcWarpVertexY: (ndx: CNIndex, vtx: Vec3, paths: Array<WeftPath>) => Vec3;
export declare const calcWeftVertexY: (ndx: CNIndex, vtx: Vec3, b: number, warps: number, wefts: number, vtx_list: Array<YarnVertex>, paths: Array<WeftPath>, sim: SimulationVars, cns: Array<ContactNeighborhood>, verbose?: boolean) => Vec3;
/**
 * computes the maximum theta for a given stretch value.
 * a very stretchy yarn (stretch = 1) would have a theta_max of PI/2 degrees. a less stretchy yarn might not be move much, so lets say PI / 24 so theta max is an interpolation between PI/4 and PI/24
 * @param stretch
 * @returns
 */
export declare const computeThetaMax: (stretch: number) => number;
/**
 * computes the angle between two vertices.
 * @param vtx1 (the last observed vertex - always computes left to right, so this is the leftmost vertex)
 * @param vtx2 (the current vertex - always computes left to right, so this is the rightmost vertex)
 * @returns the theta between the two verticies. -theta means the last vertex is highter (has a higheter y value than the current). +theta means the opposite
 */
export declare const computeThetaBetweenVertices: (vtx1: YarnVertex, vtx2: YarnVertex) => number;
/**
 * computes the y adjustment needed to move a vertex up to the theta_max.
 * @param vtx1
 * @param vtx2
 * @param theta_max
 * @returns
 */
export declare const computeYAdjustment: (vtx1: YarnVertex, vtx2: YarnVertex, theta_max: number) => number;
/**
 * TODO decide if we need to compute a global max first. This only compares pairwise.
 * scans through all the vertexes of a pick from left ot right and adjusts the angle between vertexes such that the yarn can only travel so far between the highest vertex
 * this function accounts for the fact that the beat will only push the yarn so far, it cannot keep pushing after a certain point. Therefefore, smooth yarns pulls up any vertexes that are too far below their  highest neighbor
 * @param pick
 * @param stretch
 * @returns the pick with adjusted y values
 */
export declare const smoothPick: (pick: Array<YarnVertex>, stretch: number, theta_max: number, spacing: number) => Array<YarnVertex>;
/**
 * given the x position of an ACN, this function returns the closest ACN on a blocking float for this ACN. It returns only the X distance of the closest ACN.
 * a value of 0 means the acns are directly above one another, and should stack. A value close to one, is a strong repel.
 * a larger value means that the ACNs are separated by some other distance.
 * At a later date, we make this consider x and y, in the case when the y values between vary.
 * @returns the distance between the ACNS as it would be rendered in pixels
 */
export declare const getClosestBlockingVertex: (ndx: CNIndex, vtx: Vec3, warps: number, wefts: number, vtx_list: Array<YarnVertex>, cns: Array<ContactNeighborhood>, verbose: boolean) => number;
/**
 * z points sit at the edges of the warp so the face doesn't affect the position, instead, they use control points to control the shape.
 * @param layer
 * @param layer_spacing
 * @returns
 */
export declare const calcWeftVertexZ: (pos: Vec3, face: boolean | null, layer: number, layer_spacing: number, warp_diameter: number, weft_diameter: number) => Vec3;
export declare const calcWarpVertexZ: (pos: Vec3, face: boolean | null, layer: number, layer_spacing: number) => Vec3;
/**
 * initializes a list of vertexes for every unique system-material combination used in this draft
 * @param d
 */
export declare const initWeftPaths: (d: Draft) => Array<WeftPath>;
/**
 * populates the "pics" field of the weftPaths by mapping system/material combinations to the pics upon which they occur
 * @param d the draft we are using to populate the WeftPaths
 * @param paths the newly created (should be empty) list of weft paths
 * @returns the paths with their 'pics' field updated.
 */
export declare const parseWeftPaths: (d: Draft, paths: Array<WeftPath>) => Array<WeftPath>;
export declare const getFlatVtxList: (paths: Array<WeftPath>) => Array<YarnVertex>;
export declare const getWeftPath: (paths: Array<WeftPath>, system: number, material: number) => WeftPath | null;
/**
 * this function creates warps based on what the weft is doing, using only weft ACNS as reference
 * @param wefts
 * @param min_y
 * @param max_y
 * @param weft_paths
 * @param j
 * @param sim
 * @returns
 */
export declare const createWarpPathFromWeftPaths: (wefts: number, min_y: number, max_y: number, weft_paths: Array<WeftPath>, j: number, sim: SimulationVars) => Array<YarnVertex>;
export declare const getMinY: (weft_paths: Array<WeftPath>) => number;
export declare const getMaxY: (weft_paths: Array<WeftPath>) => number;
export declare const addPlaceholderVertices: (temp_pic: Array<YarnVertex>, i: number, direction: boolean, warpnum: number, cns: Array<ContactNeighborhood>, draft: Draft, sim: SimulationVars) => Array<YarnVertex>;
/**
 * this gets the orientation between two vertexes based on the face values.
 * If two consecutive cells go from false (heddle down)=> true (heddle up) then the weft is moving from the front face to the back face (false)
* @param el
 * @param el2
 * @param warps
 * @param cns
 * @returns
 */
export declare const getOrientation: (el: YarnVertex, el2: YarnVertex, warps: number, cns: Array<ContactNeighborhood>) => boolean | null;
/**
* between each front/back facing weft float pair, there should be at least one blocking float. Update the pair based
* on the max y value (set from the blocking float). Also reposition the ACN x value in the center of the warp spacing, instead of at the edge the warp.
 * @param temp_pic
 * @returns
 */
export declare const pruneDuplicateWeftVertices: (temp_pic: Array<YarnVertex>) => Array<YarnVertex>;
/**
 *
 * @param temp_pic
 * @returns
 */
export declare const pruneDuplicateWarpVertices: (temp_pic: Array<YarnVertex>) => Array<YarnVertex>;
/**
 * because each float produces two verticies, they are redundant. remove one but update y such that the one that is kept
 * is the tallest of the two (to account for warp-face weft float blocking)
 * @param temp_pic
 * @returns
 */
export declare const reduceVerticesAndSetOrientation: (paths: Array<WeftPath>, warps: number, cns: Array<ContactNeighborhood>, sim: SimulationVars) => Array<WeftPath>;
export declare const getWeftLayer: (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>) => number;
export declare const getWarpLayer: (ndx: CNIndex, wefts: number, warps: number, cns: Array<ContactNeighborhood>) => number;
export declare const pruneWarps: (wefts: number, warps: number, cns: Array<ContactNeighborhood>) => Array<ContactNeighborhood>;
export declare const pruneWeftsAndSetCNBlocking: (wefts: number, warps: number, cns: Array<ContactNeighborhood>) => Array<ContactNeighborhood>;
export declare const placeWarps: (draft: Draft, weft_paths: Array<WeftPath>, cns: Array<ContactNeighborhood>, sim: SimulationVars) => Promise<Array<WarpPath>>;
export declare const followTheWefts: (draft: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars) => Promise<Array<WeftPath>>;
/**
 * this function walks the ACNS pick by pick. It creates a vertex anywhere it finds a weft-float ACN. It also assigns that vertex to the
 * correct weft path.
 * @param draft
 * @param floats
 * @param cns
 * @param sim
 * @returns
 */
export declare const calcClothHeightOffsetFactor: (diam: number, radius: number, offset: number) => number;
/** CODE DEVOTED TO MASS-SPRING-CALC */
export declare const printCNs: (cns: Array<ContactNeighborhood>, wefts: number, warps: number) => void;
export declare const printYValues: (cns: Array<ContactNeighborhood>, wefts: number, warps: number, mode: boolean) => void;
