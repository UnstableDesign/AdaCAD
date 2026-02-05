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
    i: number,
    j: number,
    id: number
}


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
    id: number,
    left: CNIndex,
    right: CNIndex,
    face: boolean | null,
    edge: boolean,
    blocking: Array<number>

}

/**
 * store information for ever possible point where a warp and weft can make contact
 * face - the value of the heddle at this location
 * node_type - the type of node this is (ACN, ECN, PCN, VCN)
 * layer - the layer number associated with this ACN. 
 * ndx - the index of this contact neighborhood
 * isect - the index of the closest ACN that this weft will cross with. 
 */
export type ContactNeighborhood = {
    face: boolean | null,
    node_type: CNType,
    layer: number,
    ndx: CNIndex,
    isect: CNIndex | null
}

export type Vec3 = {
    x: number,
    y: number,
    z: number
}


export type YarnVertex = {
    vtx: Vec3,
    ndx: CNIndex
    orientation: boolean | null //true if this is traveling from the back face to front, false otherwise. null if this is a placeholder vertex.
};

export type WeftPath = {
    system: number,
    material: number,
    vtxs: Array<YarnVertex>,
    pics: Array<number> // the id's of the pics that fit this description
}

export type WarpPath = {
    system: number,
    material: number,
    vtxs: Array<YarnVertex>
}

export type SimulationData = {
    draft: Draft,
    topo: Array<ContactNeighborhood>,
    wefts: Array<WeftPath>,
    warps: Array<WarpPath>
};

export type SimulationVars = {
    pack: number, //a value between 0 and 1 that represents the pack density of the fabric. 0 is fully packed, 1 is fully open.
    lift_limit: number, //a number representing how many cells to either side of a float should we also lift if one float is lifted?
    use_layers: boolean, //if true, the simulation will create layers of floats, with the lift_limit determining how many cells to lift for each layer.
    warp_spacing: number, //the spacing between warps in the fabric / epi / in mm
    layer_spacing: number, //the spacing between layers in the fabric / in mm
    wefts_as_written: boolean, //controls if the paths should be represented as running full width or not
    simulate: boolean, //if true, the physics simulation will be run. If false, the simulation will not be run.
    ms: MaterialsList //the materials list used to determine the diameter and stretch of the warps and wefts
    use_smoothing: boolean, //if true, the simulation will attempt to correct the y position of yarns that travel too far between wefts.
    repulse_force_correction: number, //a lever to control how strongly ACNs will repulse eachother. 
    time: number //the time upon which to apply the force in the ACN simulation of the simulation. 
    mass: number //the mass of the yarn in the simulation. 
    max_theta: number //the maximum theta that a yarn can travel between two ACNS
}

// export type Particle = {
//     position: THREE.Vector3,
//     previousPosition: THREE.Vector3,
//     acceleration: THREE.Vector3,
//     pinned: boolean,
//     mesh: THREE.Mesh
// }

// export type Spring = {
//     pts: Array<THREE.Vector3>,
//     mesh: THREE.Mesh,
//     p1: Particle,
//     p2: Particle,
//     restLength: number,
//     color: number,
//     diameter: number
// }


