/**
 * represts the point of this yarn within the simulation
 */
import { Draft } from "../draft";
import { MaterialsList } from "../material";
/**
 * ACN - actual contact point
 * ECN - empty contact point (weft is unset here)
 * PCN - potential contact point (there is a weft that float over this point)
 * VCN - virtual contact point (used only to draw ends of rows for sim when you want full width no matter what)
 */
export type CNType = 'ACN' | 'ECN' | 'PCN' | 'VCN';
export type CNIndex = {
    i: number;
    j: number;
    id: number;
};
/**
 * a float represents a warp or weft float within the cloth. In code, a float is anchored by two ACNs
 * id: a unique id to this float (also within the float array)
 * left: the left side or top edge of the float. weft float left id's will be 0, warp float left ids will be 2
 * right: the right or bottom edge of the float. ids will be 1 for weft floats and 3 for warp floats.
 * face: the side upon which this float (warp floats are true, weft is false)
 * edge: not sure
 * blocking: a reference to the id of the float id that restricts the movement of this float down the cloth.
 */
export type CNFloat = {
    id: number;
    left: CNIndex;
    right: CNIndex;
    face: boolean | null;
    edge: boolean;
    blocking: Array<number>;
};
/**
 * store information for ever possible point where a warp and weft can make contact
 * face - the value of the heddle at this location
 * node_type - the type of node this is (ACN, ECN, PCN, VCN)
 * layer - the layer number associated with this ACN.
 * ndx - the index of this contact neighborhood
 * isect - the index of the closest ACN that this weft will cross with.
 */
export type ContactNeighborhood = {
    face: boolean | null;
    node_type: CNType;
    layer: number;
    ndx: CNIndex;
    isect: CNIndex | null;
};
export type Vec3 = {
    x: number;
    y: number;
    z: number;
};
export type YarnVertex = {
    vtx: Vec3;
    ndx: CNIndex;
    orientation: boolean | null;
};
export type WeftPath = {
    system: number;
    material: number;
    vtxs: Array<YarnVertex>;
    pics: Array<number>;
};
export type WarpPath = {
    system: number;
    material: number;
    vtxs: Array<YarnVertex>;
};
export type SimulationData = {
    draft: Draft;
    topo: Array<ContactNeighborhood>;
    wefts: Array<WeftPath>;
    warps: Array<WarpPath>;
};
export type SimulationVars = {
    pack: number;
    lift_limit: number;
    use_layers: boolean;
    warp_spacing: number;
    layer_spacing: number;
    wefts_as_written: boolean;
    simulate: boolean;
    ms: MaterialsList;
    use_smoothing: boolean;
    repulse_force_correction: number;
    time: number;
    mass: number;
    max_theta: number;
};
