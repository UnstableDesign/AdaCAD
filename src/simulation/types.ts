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

export type CNFloat = {
    left: CNIndex,
    right: CNIndex,
    face: boolean | null,
    edge: boolean
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
    ndx: CNIndex
    isect: CNIndex | null
}

export type Vec3 = {
    x: number,
    y: number,
    z: number
}


export type YarnVertex = {
    x: number,
    y: number,
    z: number,
    ndx: CNIndex
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
    pack: number,
    lift_limit: number,
    use_layers: boolean,
    warp_spacing: number,
    layer_spacing: number,
    wefts_as_written: boolean,
    simulate: boolean,
    radius: number,
    ms: MaterialsList
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


