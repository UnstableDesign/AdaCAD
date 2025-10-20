
//import * as THREE from 'three';
import { Draft, Drawdown, getCellValue, warps, wefts } from "../draft";
import { getDiameter } from "../material";
import { filterToUniqueValues, modStrict } from "../utils";
import { CNIndex, ContactNeighborhood, CNType, CNFloat, SimulationVars, WeftPath, YarnVertex, WarpPath, SimulationData } from "./types";



/**
 * Generates all of the data required to simulate this draft. 
 * @param draft required - the draft we are going to generate a simulatation from
 * @param simVars required - the variables that will control the simulation
 * @param topo - optional - if we need not recompute the topo, you can supply it. 
 * @param wefts - optional - if we need not recompute the wefts, you can supply it. 
 * @param warps - optional - if we need not recompute the warps, you can supply it. 
 * @returns 
 */
export const computeSimulationData = async (draft: Draft, simVars: SimulationVars, topo?: Array<ContactNeighborhood>, wefts?: Array<WeftPath>, warps?: Array<WarpPath>): Promise<SimulationData> => {

    const simData: SimulationData = {
        draft: draft,
        topo: topo ?? [],
        wefts: wefts ?? [],
        warps: warps ?? []
    };

    if (simData.topo.length == 0)
        simData.topo = await getDraftTopology(simData.draft, simVars);

    if (simData.wefts.length == 0)
        simData.wefts = await followTheWefts(simData.draft, simData.topo, simVars);

    if (simData.warps.length == 0)
        simData.warps = await renderWarps(simData.draft, simData.topo, simData.wefts, simVars);

    return Promise.resolve(simData);

}


// CONTACT NEIGHBORHOOD UTILITIES // 

const setIndex = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    const cn = getCN(ndx, warps, cns);
    cn.ndx = ndx;
    return cns;
}

const setFace = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, value: boolean | null): Array<ContactNeighborhood> => {
    const cn = getCN(ndx, warps, cns);
    cn.face = value;
    return cns;
}

const getFace = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): boolean | null => {
    const cn = getCN(ndx, warps, cns);
    return cn.face
}

const setNodeType = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, type: CNType): Array<ContactNeighborhood> => {
    const cn = getCN(ndx, warps, cns);
    cn.node_type = type;
    return cns;
}

export const getNodeType = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): CNType => {
    const cn = getCN(ndx, warps, cns);
    return cn.node_type
}

// const setMvY = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, mv_y: number): Array<ContactNeighborhood> => {
//     if (ndx.j < 0 || ndx.j >= warps) return cns;
//     const cn = getCN(ndx, warps, cns);
//     cn.mv.y = mv_y;
//     return cns;
// }

// const getMvY = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): number => {
//     const cn = getCN(ndx, warps, cns);
//     return cn.mv.y;
// }

const setLayer = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, layer: number): Array<ContactNeighborhood> => {
    if (ndx.j < 0 || ndx.j >= warps) return cns;
    const cn = getCN(ndx, warps, cns);
    cn.layer = layer;
    return cns;
}

export const getLayer = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): number => {
    const cn = getCN(ndx, warps, cns);
    return cn.layer;
}


const getCN = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): ContactNeighborhood => {
    const ndx_flat = 4 * (ndx.i * warps + ndx.j) + ndx.id;
    return cns[ndx_flat];
}

const setAndOppositeFaces = (f1: boolean | null, f2: boolean | null): boolean => {
    if (f1 == null || f2 == null) return false;
    return (f1 !== f2);
}

const setAndSameFaces = (f1: boolean | null, f2: boolean | null): boolean => {
    if (f1 == null || f2 == null) return false;
    return (f1 == f2);
}

/**
 * uses the contact neighborhoods on this row to get a list of floats. Some floats may be out of range (> warps) in the case where the pattern would repeat and wrap
 * @param i 
 * @param warps 
 * @param cns 
 * @returns 
 */
export const getRowAsFloats = (i: number, warps: number, cns: Array<ContactNeighborhood>): Array<CNFloat> => {


    const floats: Array<CNFloat> = [];
    const lefts = cns.filter(el => el.node_type == 'ACN' && el.ndx.i == i && el.ndx.id == 0);
    const rights = cns.filter(el => el.node_type == 'ACN' && el.ndx.i == i && el.ndx.id == 1);
    if (lefts.length !== rights.length) console.error("THIS ROW HAS AN UNEVEN NUMBER OF ACNS")


    lefts.forEach(left => {
        let found = false;

        for (let j = left.ndx.j; j < warps && !found; j++) {
            const right = rights.find(el => el.ndx.j == j);
            if (right !== undefined) {
                found = true;
                floats.push({
                    left: left.ndx,
                    right: right.ndx,
                    edge: false,
                    face: left.face
                })
            }
        }

        if (!found) {
            const right = rights.shift();
            if (right !== undefined) {
                floats.push({
                    left: left.ndx,
                    right: { i: right.ndx.i, j: warps + right.ndx.j, id: 1 }, //get the first in the list
                    edge: false,
                    face: left.face
                })
            }
        }


    })

    return floats;


}

/**
 * uses the contact neighborhoods on this column to get a list of floats. Some floats may be out of range (> wefts) so that they can readily apply to the edges relationships
 * @param i 
 * @param warps 
 * @param cns 
 * @returns 
 */
export const getColAsFloats = (j: number, wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<CNFloat> => {

    const floats: Array<CNFloat> = [];
    const lefts = cns.filter(el => el.node_type == 'ACN' && el.ndx.j == j && el.ndx.id == 2);
    const rights = cns.filter(el => el.node_type == 'ACN' && el.ndx.j == j && el.ndx.id == 3);
    if (lefts.length !== rights.length) console.error("THIS COL HAS AN UNEVEN NUMBER OF ACNS")


    lefts.forEach(left => {
        let found = false;

        for (let i = left.ndx.i; i < wefts && !found; i++) {
            const right = rights.find(el => el.ndx.i == i);
            if (right !== undefined) {
                found = true;
                floats.push({
                    left: left.ndx,
                    right: right.ndx,
                    edge: false,
                    face: left.face
                })
            }
        }

        if (!found) {
            const right = rights.shift();
            if (right !== undefined) {
                floats.push({
                    left: left.ndx,
                    right: { j: right.ndx.j, i: wefts + right.ndx.i, id: 3 }, //get the first in the list
                    edge: false,
                    face: left.face
                })
            }
        }


    })

    return floats;


}



/**
 * used in support of determining how floats stack, this function gets a list of id's that are attached to a given float. Since more than one float may be attached, this takes that list of ids and returns the number of floats it represents. 
 * @param i 
 * @param warps 
 * @param face 
 * @param segments the list of indicies
 * @param cns 
 * @returns 
 */
const extractFloat = (i: number, warps: number, face: boolean | null, segments: Array<number>, cns: Array<ContactNeighborhood>): { float: CNFloat | null, last: number } => {

    //walk to the first ACN
    let start = null;
    let end = null;

    for (let s = 0; s < segments.length; s++) {

        //check the left side
        const adj_j = modStrict(segments[s], warps);
        if (getNodeType({ i, j: adj_j, id: 0 }, warps, cns) == 'ACN') {
            if (start == null) {
                start = { i, j: segments[s], id: 0 }
            }
        }
        //check the right side
        if (getNodeType({ i, j: adj_j, id: 1 }, warps, cns) == 'ACN') {
            if (start !== null) {
                end = { i, j: segments[s], id: 1 };
                const edge = (end.j >= warps - 1 || start.j <= 0);
                return { float: { left: start, right: end, face, edge }, last: segments[s] }
            }
        }

    }
    //got to the end and there was no closing this might mean we have reached the end of the row. 
    return { float: null, last: segments.length }
}

/**
 * given a point, this function returns the float upon which this point sits
 * @param i 
 * @param j 
 */
const getWarpFloat = (i: number, j: number, wefts: number, warps: number, cns: Array<ContactNeighborhood>): CNFloat | null => {
    let left = null;
    let count = 0;

    //confirm this is a weft float and not an unset 
    const face = getFace({ i, j, id: 0 }, warps, cns);
    if (face == null || face == false) return null;


    //walk up
    while (left == null && count < wefts) {
        const type = getNodeType({ i, j, id: 2 }, warps, cns);
        if (type == 'ACN') {
            left = { i, j, id: 2 };
        } else {
            i = modStrict(i - 1, wefts);
        }
        count++;
    }

    //walk down
    let right = null;
    count = 0;
    while (right == null && count < warps) {
        const type = getNodeType({ i, j, id: 3 }, warps, cns);
        if (type == 'ACN') {
            right = { i, j, id: 3 };
        } else {
            i = modStrict(i + 1, wefts);
        }
        count++;
    }

    if (left == null || right == null) return null;

    return {
        left, right, edge: false, face: true
    }

}


/**
 * given a point, this function returns the float upon which this point sits
 * @param i 
 * @param j 
 */
const getWeftFloat = (i: number, j: number, warps: number, cns: Array<ContactNeighborhood>): CNFloat | null => {
    let left: CNIndex = { i: -1, j: -1, id: -1 };
    let count = 0;
    let j_adj = j;

    //confirm this is a weft float and not an unset 
    const face = getFace({ i, j, id: 0 }, warps, cns);
    if (face == null || face == true) return null;

    //walk left
    while (left.id == -1 && count < warps) {
        const type = getNodeType({ i, j: j_adj, id: 0 }, warps, cns);
        if (type == 'ACN') {
            left = { i, j: j_adj, id: 0 };
        } else {
            j_adj = modStrict(j_adj - 1, warps);
        }
        count++;
    }

    //walk right
    let right: CNIndex = { i: -1, j: -1, id: -1 };
    count = 0;
    j_adj = j;
    while (right.id == -1 && count < warps) {
        const type = getNodeType({ i, j: j_adj, id: 1 }, warps, cns);
        if (type == 'ACN') {
            right = { i, j: j_adj, id: 1 };
        } else {
            j_adj = modStrict(j_adj + 1, warps);
        }
        count++;
    }

    return {
        left, right, edge: false, face: false
    }

}

const getWeftFloatLength = (f: CNFloat, warps: number): number => {
    if (f.right.j >= f.left.j) return f.right.j - f.left.j;
    else return warps - f.left.j + f.right.j;
}

const getWarpFloatLength = (f: CNFloat, wefts: number): number => {
    if (f.right.i >= f.left.i) return f.right.i - f.left.i;
    else return wefts - f.left.i + f.right.i;
}




/**
 * get all the weft-wise floats with the same face value that share an edge with the input float that reside on the row indicated by i. Given that if we are assuming repeats, some indexes might be beyond or not actually existing in the cn list
 * @param i 
 * @param warps 
 * @param float 
 * @param cns 
 * @returns 
 */
const getAttachedFloats = (i: number, wefts: number, warps: number, float: CNFloat, cns: Array<ContactNeighborhood>): Array<CNFloat> => {
    const attached = [];
    let segments = [];



    if (i < 0) i = modStrict(i, wefts);


    //walk along the input float and push any lower neighbors that match face
    for (let j = float.left.j; j <= float.right.j; j++) {
        const adj_j = modStrict(j, warps); //protect when float ends are out of range
        const face = getFace({ i, j: adj_j, id: 0 }, warps, cns);
        if (float.face !== null && float.face == face) {
            segments.push(j)
        }
    }


    if (segments.length == 0) return [];

    const left_edge = segments[0];
    const right_edge = segments[segments.length - 1]


    //walk left to find attached
    let edge_found = false;
    for (let count = 1; count < warps && !edge_found; count++) {
        const adj_j = modStrict((left_edge - count), warps);
        const face = getFace({ i, j: adj_j, id: 0 }, warps, cns);
        if (float.face !== null && float.face == face) {
            segments.unshift((left_edge - count))
        } else {
            edge_found = true;
        }
    }


    //walk right to find attached
    edge_found = false;
    for (let count = 1; count < warps && !edge_found; count++) {
        const adj_j = modStrict((right_edge + count), warps);
        const face = getFace({ i, j: adj_j, id: 0 }, warps, cns);
        if (float.face !== null && float.face == face) {
            segments.push(right_edge + count);

        } else {
            edge_found = true;
        }
    }

    //SEGMENTS NOW CONTAINS A LIST OF ALL the Cells of the same face color, the left most and right most CNS in these cells should be the edges. This list may be empty if there was only the opposite color attached. 

    let loops = 0;
    while (segments.length > 0 && loops < 20) {
        loops++;
        const extracted = extractFloat(i, warps, float.face, segments, cns);
        if (extracted.float !== null) {
            attached.push(extracted.float)
        }

        segments = segments.filter(el => el > extracted.last);
    }

    return attached;
}

/**
 * Given two floats that lie above each other on the draft, this function determines the relation ship of the float and the floats on previous rows. 
 * @param float 
 * @param attached 
 * @returns 
 */
const getWarpwiseRelationship = (float: CNFloat, attached: Array<CNFloat>): Array<string> => {

    const res: Array<string> = attached.reduce((acc: Array<string>, el) => {
        const top_length = float.right.j - float.left.j;
        const bottom_length = el.right.j - el.left.j;

        if (float.right.j > el.right.j && float.left.j > el.left.j) acc.push("BUILD");
        else if (float.right.j < el.right.j && float.left.j < el.left.j) acc.push("BUILD");
        else if (float.right.j == el.right.j && float.left.j == el.left.j) acc.push("STACK");
        else if (float.left.j == el.left.j || float.right.j == el.right.j) {
            if (top_length > bottom_length) {
                if (float.face == false) acc.push("SLIDE-OVER")
                else acc.push("SLIDE-UNDER")
            } else {
                if (float.face == false) acc.push("SLIDE-UNDER")
                else acc.push("SLIDE-OVER")
            }
        }

        else if (float.left.j < el.left.j && float.right.j > el.right.j) {
            if (float.face == false) acc.push("SLIDE-OVER");
            else acc.push("SLIDE-UNDER");
        }

        else if (float.left.j > el.left.j && float.right.j < el.right.j) {
            if (float.face == false) acc.push("SLIDE-UNDER");
            else acc.push("SLIDE-OVER");
        } else {
            console.error(" UNACCOUNTED FOR RELATIONSHIP FOUND BETWEEN ", float, el)
        }
        return acc;
    }, []);


    return res;







}


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
export const getNextCellOnLayer = (i: number, j: number, wefts: number, warps: number, layer: number, direction: string, cns: Array<ContactNeighborhood>): { i: number, j: number } | null => {
    const i_base = i;
    const j_base = j;

    switch (direction) {
        case "above":
            for (let i_offset = 1; i_offset < wefts - 1; i_offset++) {
                const i_adj = modStrict(i_base - i_offset, wefts);
                if (getLayer({ i: i_adj, j, id: 0 }, warps, cns) == layer) {
                    return { i: i_adj, j }
                }
            }
            return null;

        case "below":
            for (let i_offset = 1; i_offset < wefts - 1; i_offset++) {
                const i_adj = modStrict(i_base + i_offset, wefts);
                if (getLayer({ i: i_adj, j, id: 0 }, warps, cns) == layer) {
                    return { i: i_adj, j }
                }
            }
            return null;


        case "left":
            for (let j_offset = 1; j_offset < warps - 1; j_offset++) {
                const j_adj = modStrict(j_base - j_offset, warps);
                if (getLayer({ i, j: j_adj, id: 0 }, warps, cns) == layer) {
                    return { i, j: j_adj }
                }
            }
            return null;


        case "right":
            for (let j_offset = 1; j_offset < warps - 1; j_offset++) {
                const j_adj = modStrict(j_base + j_offset, warps);
                if (getLayer({ i, j: j_adj, id: 0 }, warps, cns) == layer) {
                    return { i, j: j_adj }
                }
            }
            return null;
    }

    console.error("DIRECTION ", direction, "NOT FOUND")
    return null;
}


/**
 * given two faces (assuming two neighboring faces), this function determines what kind of node type should be assigned
 * @param f1 - current face
 * @param f2 - assumes this is "last face", which makes a difference!
 * @param ndx 
 * @param warps 
 * @param cns 
 * @returns 
 */
export const classifyNodeTypeBasedOnFaces = (f1: boolean | null, f2: boolean | null, ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    if (setAndOppositeFaces(f1, f2)) {
        cns = setNodeType(ndx, warps, cns, 'ACN');
    } else if (setAndSameFaces(f1, f2)) {
        cns = setNodeType(ndx, warps, cns, 'PCN')
    } else if (f1 !== null && f2 == null) {
        cns = setNodeType(ndx, warps, cns, 'ACN')
    } else {
        cns = setNodeType(ndx, warps, cns, 'ECN')
    }
    return cns;
}



// LAYER PARSING

/**
 * given a range in i and/or j this returns any float that has at least part of it within the boundary formed by i and j. 
 * @param i  //the l can be less than 0 and r can be greater than wefts
 * @param j 
 * @param fs 
 */
export const getUntouchedFloatsInRange = (i: { l: number, r: number }, j: { l: number, r: number }, all_floats: Array<{ id: number, float: CNFloat; touched: boolean }>, wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<number> => {


    const candidates: Array<CNFloat> = [];
    let in_range: Array<number> = [];

    //unwrap the range
    if (i.l > i.r) {
        i.r = wefts + i.r;
    }

    //unwrap the range
    if (j.l > j.r) {
        j.r = warps + j.r;
    }

    for (let x = i.l; x <= i.r; x++) {
        for (let y = j.l; y <= j.r; y++) {
            const adj_i = modStrict(x, wefts);
            const adj_j = modStrict(y, warps);
            const weft = getWeftFloat(adj_i, adj_j, warps, cns);
            if (weft !== null) candidates.push(weft);

            const warp = getWarpFloat(adj_i, adj_j, wefts, warps, cns);
            if (warp !== null) candidates.push(warp);

        }
    }
    in_range = candidates.map(el => getFloatIndex(el, all_floats)).filter(el => el !== -1 && !all_floats[el].touched);

    return in_range;


}

const rowHasActiveCNs = (i: number, warps: number, cns: Array<ContactNeighborhood>): boolean => {

    const active = cns.filter(el => el.ndx.i == i && el.node_type !== 'ECN' && el.ndx.id < 2);
    return active.length > 0;

}


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
export const getFloatsAffectedByLifting = (id: number, all_floats: Array<{ id: number, float: CNFloat; touched: boolean }>, wefts: number, warps: number, limit: number, cns: Array<ContactNeighborhood>) => {

    let attached: Array<number> = [];
    const float_with_id = all_floats.find(el => el.id == id);
    if (float_with_id == undefined) return [];

    const float = float_with_id.float;

    let i_range, j_range = null;

    if (float.face) {
        //this is warp facing.

        if ((getWarpFloatLength(float, wefts) + (limit * 2)) >= wefts) {
            i_range = { l: 0, r: wefts - 1 };

        } else {
            i_range = { l: modStrict(float.left.i - limit, wefts), r: modStrict(float.right.i + limit, wefts) };

        }

        j_range = { l: float.left.j, r: float.right.j };
    } else {
        //this is weft facing. 

        if (getWeftFloatLength(float, warps) + limit * 2 >= warps) {
            j_range = { l: 0, r: warps - 1 };

        } else {
            j_range = { l: modStrict(float.left.j - limit, warps), r: modStrict(float.right.j + limit, warps) };
        }

        i_range = { l: float.left.i, r: float.right.i };

    }


    attached = getUntouchedFloatsInRange(i_range, j_range, all_floats, wefts, warps, cns);
    attached = <Array<number>>filterToUniqueValues(attached);
    attached = attached.filter(el => el !== id); //filter out the float that called the function
    return attached;

}

//sets this entire node to ECN and the face to null
const unsetNodesAtIJ = (i: number, j: number, warps: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    cns = setFace({ i, j, id: 0 }, warps, cns, null);
    cns = setFace({ i, j, id: 1 }, warps, cns, null);
    cns = setFace({ i, j, id: 2 }, warps, cns, null);
    cns = setFace({ i, j, id: 3 }, warps, cns, null);

    //SET LEFT AND RIGHT TO EMPTY
    cns = setNodeType({ i, j, id: 0 }, warps, cns, 'ECN');
    cns = setNodeType({ i, j, id: 1 }, warps, cns, 'ECN');

    //SET TOP AND BOTTOM to POTENTIAL, 
    cns = setNodeType({ i, j, id: 2 }, warps, cns, 'PCN');
    cns = setNodeType({ i, j, id: 3 }, warps, cns, 'PCN');

    return cns;

}

/**
 * this function adjusts the CN Node Types based on what might happen between successive throws on the same weft (e.g. where will it catch the edge)
 * @param pick_id the current pick we are pulling through
 * @param j the current j index that we are checking 
 * @param valid_picks a list of all the picks associated with this weft, that we have already seen, that are valid (e.g. they have at least one ACN)
 * @param warps the number of warps
 * @param right boolean to signify if we are moving left to right (false) or right to left (true). 
 * @param cns 
 * @returns the list of updated CNs and the next j index to check (if needed). Returns -1 if 
 */
const determineEdgeBehavior = (pick_id: number, j: number, valid_picks: Array<number>, warps: number, right: boolean, cns: Array<ContactNeighborhood>): { cns: Array<ContactNeighborhood>, next_j: number } => {


    const directions = { left: { inc: 1, id: 0 }, right: { inc: -1, id: 1 } };
    const dir = (right) ? directions.right : directions.left;

    if (valid_picks.length <= 1) return { cns, next_j: -1 };

    const top = valid_picks[pick_id];
    const bottom = valid_picks[modStrict(pick_id - 1, valid_picks.length)];


    const top_f = getFace({ i: top, j, id: 0 }, warps, cns);
    const bottom_f = getFace({ i: bottom, j, id: 0 }, warps, cns);




    if (setAndSameFaces(top_f, bottom_f)) {
        //  - or | 
        //  - or |
        //set both left and right to ECN
        //continue the search with the next pair
        cns = unsetNodesAtIJ(top, j, warps, cns);
        cns = unsetNodesAtIJ(bottom, j, warps, cns);

        return { cns, next_j: j + dir.inc };

    } else if (setAndOppositeFaces(top_f, bottom_f)) {
        // - or |
        // | or -
        //if moving left-to-right the left side would be pulling out, so set these to ACNs suggesting they bind
        //end the search

        cns = setNodeType({ i: top, j, id: dir.id }, warps, cns, 'ACN');
        cns = setNodeType({ i: bottom, j, id: dir.id }, warps, cns, 'ACN');

        return { cns, next_j: -1 };

    } else if (top_f == null) {

        // | (bottom = previous row, set and up ) 
        // 0 (top = current row, unset which we interpret, in reality, this is interpreted as a heddle down )
        //find the last place there was a set cell on the top row and set it to ACN

        if (bottom_f == true) {
            for (let search = j + dir.inc; search >= 0 && search < warps; search = search + dir.inc) {
                if (getFace({ i: top, j: search, id: 0 }, warps, cns) !== null) {
                    cns = setNodeType({ i: bottom, j: search, id: dir.id }, warps, cns, 'ACN');
                    return { cns, next_j: -1 };
                }
            }
            return { cns, next_j: -1 }
        }
        else if (bottom_f == false) {
            // - (bottom = previous row, set and heddle down)
            // 0 (top = unset)
            // these are functionally the same in how they are rendered in the draft, so same rules as set and same apply

            cns = unsetNodesAtIJ(top, j, warps, cns);
            cns = unsetNodesAtIJ(bottom, j, warps, cns);
            return { cns, next_j: j + dir.inc };
        }
        else {
            return { cns, next_j: j + dir.inc };
        }
    } else if (bottom_f == null) {


        if (top_f) {
            // 0 (bottom = previous row, unset)
            // | (top = heddle lifted)
            // the top edge will bind so set the ACN based on the direction and quit
            cns = setNodeType({ i: top, j, id: dir.id }, warps, cns, 'ACN');
            return { cns, next_j: -1 };
        } else {
            // 0 (bottom = previous row, unset)
            // _ (top = heddle lowered)
            // these are functionally thee same so cancel out the nodes and keep searching
            cns = unsetNodesAtIJ(top, j, warps, cns)
            cns = unsetNodesAtIJ(bottom, j, warps, cns) //we shouldn't need to do this, but just in case?
            return { cns, next_j: j + dir.inc };
        }
    } else {
        console.error("UNHANDLED EDGE BEHAVIOR", top, bottom, j, top_f, bottom_f)
        return { cns, next_j: j + dir.inc };

    }

}


/**
 * if we pull on the edge of a freshly inserted weft, we need to see if it will unpick or not. This simulates how the weft might unpick (as a relationship to other wefts that share a material and system and then update the contact nodes to account for the behavior of this weft. )
 * @param bottom 
 * @param j 
 * @param warps 
 * @param cns 
 * @returns 
 */
//   const determineRightEdgeBehavior = (top: number, bottom: number, next: number, j: number, warps: number, cns: Array<ContactNeighborhood>) : {cns: Array<ContactNeighborhood>, next_j: number} => {
//   let top_f = getFace({i:top, j, id: 0}, warps, cns);
//   let bottom_f = getFace({i:bottom, j, id: 0}, warps, cns);

//   if(setAndSameFaces(top_f, bottom_f)){

//     //SET LEFT AND RIGHT TO EMPTY
//     cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
//     cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
//     cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
//     cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');

//     //SET TOP AND BOTTOM to POTENTIAL, 
//     cns = setNodeType({i:top, j, id:2}, warps, cns, 'PCN');
//     cns = setNodeType({i:bottom, j, id:2}, warps, cns, 'PCN');
//     cns = setNodeType({i:top, j, id:3}, warps, cns, 'PCN');
//     cns = setNodeType({i:bottom, j, id:3}, warps, cns, 'PCN');

//     return {cns, next_j: j-1};

//   }else if(setAndOppositeFaces(top_f, bottom_f)){

//     cns = setNodeType({i:top, j, id:1}, warps, cns, 'ACN');
//     cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ACN');

//     return {cns, next_j: -1};


//   }else if(top_f == null){

//     if(bottom_f == true){
//       for(let search = j-1; search <= 0; search--){
//         if(getFace({i:top, j:search, id:0}, warps, cns) !== null){
//            cns = setNodeType({i:bottom, j:search, id:1}, warps, cns, 'ACN');
//           return {cns, next_j: -1};
//         }
//       }
//       //I got to the end and it never found anything, just stop
//       return {cns, next_j:-1}
//     }
//     else if(bottom_f == false){

//       cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
//       cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
//       cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
//       cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');
//       return {cns, next_j: j-1};
//     }
//     else {
//       return {cns, next_j: j-1};
//     }
//   }else if(bottom_f == null){
//     if(top_f){
//        cns = setNodeType({i:top, j, id:1}, warps, cns, 'ACN');
//       return {cns, next_j: -1};
//     }else{
//       cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
//       cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
//       return {cns, next_j: j-1};
//     }
//   }else{
//     console.error("UNHANDLED RIGHT EDGE BEHAVIOR", top, bottom, j, top_f, bottom_f)

//   }

// }

/**
 * when pulling the row, we need to know if or how to pull the yarn based on the relationships between acns on successive wefts. For instance, if it iterlaces the edge or if it is a repeat and essentially pulls itself out of the structure. 
 * @param top 
 * @param bottom 
 * @param j 
 * @param warps 
 * @param cns 
 * @returns 
 */
// const determineLeftEdgeBehavior = (top: number, bottom: number, j: number, warps: number, cns: Array<ContactNeighborhood>) : {cns: Array<ContactNeighborhood>, next_j: number} => {


//   let top_f = getFace({i:top, j, id: 0}, warps, cns);
//   let bottom_f = getFace({i:bottom, j, id: 0}, warps, cns);


//   if(setAndSameFaces(top_f, bottom_f)){
//     // console.log("SET AND SAME")

//     cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
//     cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
//     cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
//     cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');

//     cns = setNodeType({i:top, j, id:2}, warps, cns, 'PCN');
//     cns = setNodeType({i:bottom, j, id:2}, warps, cns, 'PCN');
//     cns = setNodeType({i:top, j, id:3}, warps, cns, 'PCN');
//     cns = setNodeType({i:bottom, j, id:3}, warps, cns, 'PCN');
//     return {cns, next_j: j+1};

//   }else if(setAndOppositeFaces(top_f, bottom_f)){
//     // console.log("SET AND OP")

//     cns = setNodeType({i:top, j, id:0}, warps, cns, 'ACN');
//     cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ACN');
//     return {cns, next_j: -1};

//   }else if(top_f == null){

//       if(bottom_f == true){
//           // console.log("UNSET (top) and RAISED (bottom)")

//           for(let search = j+1; search < warps; search++){
//             if(getFace({i:top, j:search, id:0}, warps, cns) !== null){
//               cns = setNodeType({i:bottom, j:search, id:0}, warps, cns, 'ACN');
//               return {cns, next_j: -1};
//             }
//           }
//           //I got to the end and it never found anything, just stop
//           return {cns, next_j:-1}
//       }
//       else if(bottom_f == false){
//             // console.log("UNSET (top) and Lowered (bottom)")

//           cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
//           cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
//           cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
//           cns = setNodeType({i:bottom, j, id:1}, warps, cns, 'ECN');
//           return {cns, next_j: j+1};
//       }
//       else {
//           //console.log("UNSET BOTH")
//           return {cns, next_j: j+1};
//         } 
//   }else if(bottom_f == null){

//     //handle if top is black or top is while
//     if(top_f){
//         cns = setNodeType({i:top, j, id:0}, warps, cns, 'ACN');
//         return {cns, next_j: -1};
//     }else{
//        cns = setNodeType({i:top, j, id:0}, warps, cns, 'ECN');
//        cns = setNodeType({i:bottom, j, id:0}, warps, cns, 'ECN');
//        cns = setNodeType({i:top, j, id:1}, warps, cns, 'ECN');
//        return {cns, next_j: j+1};
//     }


//   }else{
//     console.error("UNHANDLED LEFT EDGE BEHAVIOR", top, bottom, j, top_f, bottom_f)
//   }

// }


/**
 * determining layers requires keeping a list of floats with ids. This function takes a given float and sees if there is a float in the list that matches it's dimensions, returning the id of the index at which that float was found. 
 * @param float 
 * @param all_float_objs 
 * @returns 
 */
const getFloatIndex = (float: CNFloat, all_float_objs: Array<{ id: number, float: CNFloat, touched: boolean }>): number => {

    if (float == null || float.left == null || float.right == null) {
        console.error("FLOAT IS NULL GET IN GET INDEX ", float);
        return -1;
    }
    const ndx = all_float_objs.findIndex(el => el.float.left.i == float.left.i && el.float.left.j == float.left.j && el.float.left.id == float.left.id);

    //if(ndx == -1) console.error("FLOAT OBJS DID NOT CONTAIN OBJECT", float, all_float_objs);
    return ndx;

}


const setFloatZ = (float: CNFloat, wefts: number, warps: number, layer: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    //lift the entire float: 
    if (float.face) {

        for (let x = 0; x <= getWarpFloatLength(float, wefts); x++) {
            const adj_i = modStrict(float.left.i + x, wefts);
            //only set values that have no already been set by another layer
            if (getLayer({ i: adj_i, j: float.left.j, id: 0 }, warps, cns) == 0) {
                cns = setLayer({ i: adj_i, j: float.left.j, id: 0 }, warps, cns, layer);
                cns = setLayer({ i: adj_i, j: float.left.j, id: 1 }, warps, cns, layer);
                cns = setLayer({ i: adj_i, j: float.left.j, id: 2 }, warps, cns, layer);
                cns = setLayer({ i: adj_i, j: float.left.j, id: 3 }, warps, cns, layer);
            }
        }
    } else if (float.face === false) {
        for (let x = 0; x <= getWeftFloatLength(float, warps); x++) {
            const adj_j = modStrict(float.left.j + x, warps);
            if (getLayer({ i: float.left.i, j: adj_j, id: 0 }, warps, cns) == 0) {
                cns = setLayer({ i: float.left.i, j: adj_j, id: 0 }, warps, cns, layer);
                cns = setLayer({ i: float.left.i, j: adj_j, id: 1 }, warps, cns, layer);
                cns = setLayer({ i: float.left.i, j: adj_j, id: 2 }, warps, cns, layer);
                cns = setLayer({ i: float.left.i, j: adj_j, id: 3 }, warps, cns, layer);
            }
        }

    }

    return cns;
}




/**
 * this needs to recursively search the previous rows (and loop if needed) to determine how far this float could slide down behind the previous rows if there was no fell line or beater. 
 * @param i the row to which we are comparing
 * @param mvy the number of rows this has already moved
 * @param float the float we are comparing to
 * @param warps the width of the cloth
 * @param cns the list of contact neighborhoods
 */
const calcMVYValue = (i: number, i_start: number, mvy: number, z_map: Array<{ i: number, reltn: string }>, float: CNFloat, wefts: number, warps: number, cns: Array<ContactNeighborhood>): { isect_i: number, next_i: number } => {

    //wrap to continue search but eventually stop if we've covered the whole cloth
    let adj_i = i;
    if (i < 0) adj_i = modStrict(i, wefts);
    if (modStrict(i, wefts) == i_start) return { isect_i: -1, next_i: -1 };
    //get all of the attached floats on i
    const attached: Array<CNFloat> = getAttachedFloats(adj_i, wefts, warps, float, cns);

    //we need a bit more information in this case
    let reltn = [];

    if (attached.length == 0) {
        //peak right and left; 
        const right_edge_ndx = { i: adj_i, j: float.right.j, id: 1 };
        const right_edge_type = getNodeType(right_edge_ndx, warps, cns);
        const left_edge_ndx = { i: adj_i, j: float.left.j, id: 0 };
        const left_edge_type = getNodeType(left_edge_ndx, warps, cns);

        if (left_edge_type == "ACN" || right_edge_type == 'ACN') {
            reltn.push("BUILD");
        } else {
            reltn.push(["SLIDE-OPP"]); //sliding on the opposite side of the warp
        }

    } else {
        //determine what kind of relationship the 
        reltn = getWarpwiseRelationship(float, attached);
    }


    //console.log("FOUND RELATIONS ", float, reltn.map(el => String(el)))
    //adjust the right side of the float to clamp the value in: 
    if (reltn.find(el => el == "BUILD") !== undefined) {
        return { isect_i: i, next_i: - 1 };

    } else if (reltn.find(el => el == "SLIDE-OPP") !== undefined) {
        return { isect_i: -1, next_i: i - 1 }


    } else if (reltn.find(el => el == "STACK") !== undefined) {
        return { isect_i: -1, next_i: i - 1 }
    } else {

        if (reltn.find(el => el == "SLIDE-OVER") !== undefined) {
            return { isect_i: -i, next_i: i - 1 };
        } else if (reltn.find(el => el == "SLIDE-UNDER") !== undefined) {
            return { isect_i: i, next_i: i - 1 };
        } else {
            return { isect_i: -1, next_i: -1 };
        }

    }
}






// TOP LEVEL FUNCTIONS USED TO BUILD THE TOPOLOGY

/**
 * creates an empty set of CN's for the given drawdown and then walks through and populates their face and id values. 
 * @param dd 
 * @returns an initialized list of contact neighborhoods
 */
export const initContactNeighborhoods = (dd: Drawdown): Promise<Array<ContactNeighborhood>> => {
    const width = warps(dd);
    const height = wefts(dd);
    const size = width * height * 4;
    let cns: Array<ContactNeighborhood> = new Array<ContactNeighborhood>(size);

    for (let x = 0; x < cns.length; x++) {
        cns[x] = {
            ndx: { i: 0, j: 0, id: 0 },
            node_type: 'ECN',
            layer: 0,
            face: null,
            isect: null
        }
    }

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {

            cns = setIndex({ i, j, id: 0 }, width, cns);
            cns = setIndex({ i, j, id: 1 }, width, cns);
            cns = setIndex({ i, j, id: 2 }, width, cns);
            cns = setIndex({ i, j, id: 3 }, width, cns);

            const face = getCellValue(dd[i][j]);
            cns = setFace({ i, j, id: 0 }, width, cns, face)
            cns = setFace({ i, j, id: 1 }, width, cns, face)
            cns = setFace({ i, j, id: 2 }, width, cns, face)
            cns = setFace({ i, j, id: 3 }, width, cns, face)

        }
    }
    return Promise.resolve(cns);
}


/**
 * Y Placement is a function of: 
 * t: tautness of insertion weft
 * s: the location of the closest crossing float. 
 * d: the density of the warps 
 */


export const getClosestACNOnWeft = (i: number, ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): CNIndex | null => {
    const acns = cns.filter(el => el.node_type == "ACN" && el.ndx.i == i);
    const closest = acns.reduce<{ dist: number, ndx: CNIndex | null }>((acc, el) => {
        const dist = Math.abs(el.ndx.j - ndx.j);
        if (dist < acc.dist) return { dist: dist, ndx: el.ndx };
        return acc;
    }, { dist: 1000, ndx: null });
    return closest.ndx;
}


/**
 * analyses the relationship between the current row's CNS and the previous rows CNS to determine if and how far the floats on this row can pack. The ability for this weft to move is represented by MVY. 
 * MVY will be a decimal number. The whole number will represent the i row upon which this ACN will stack. The decimal represents how closely this will pack. 
 * @param i the row number
 * @param cns the list of current contact neighborhoods
 */
export const packPicks = (wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    for (let i = 0; i < wefts; i++) {
        console.log("CHECKING i ", i)
        const floats: Array<CNFloat> = getRowAsFloats(i, warps, cns);
        console.log("FLOATS ", floats)

        floats.forEach(float => {
            console.log("CHECKING FLOAT ", float.face, float.left.j, float.right.j)

            if (float.face != null) {
                let obj = calcMVYValue(i - 1, i, 0, [], float, wefts, warps, cns);
                console.log("*RETURNED ", obj)
                while (obj.next_i !== null) {
                    obj = calcMVYValue(obj.next_i, i, obj.mvy, obj.z_map, float, wefts, warps, cns);
                    console.log("RETURNED ", obj)
                }

                //set the layer for the left side of the float
                const intersecting_i = i - obj.mvy;

                const intersecting_ndx = { i: intersecting_i, j: float.left.j, id: 0 };
                cns = setMvY(float.left, warps, cns, obj.mvy);
                const adj_right: CNIndex = {
                    i: float.right.i,
                    j: modStrict(float.right.j, warps),
                    id: float.right.id
                };

                cns = setMvY(adj_right, warps, cns, obj.mvy);


            }
        });
    }
    return cns;

}



/**
 * updates the list of CNS by assigning each CN values based on it's relationship in the draft. 
 * if a CN has been assigned a layer it is ignored  
 * specifically, it looks at every neighbor (by edge) of the cell and sees if it is the same or a different value
 * if the edge borders differing values, it becomes an ACN, if not, it remains a VCN
 * A PCN borders an unset?
 * @param cns 
 * @param wefts 
 * @param warps 
 * @param sim 
 * @returns 
 */
export const updateCNs = (cns: Array<ContactNeighborhood>, wefts: number, warps: number, sim: SimulationVars): Array<ContactNeighborhood> => {
    // console.log("UPDATE CNS ",)

    const regions = [
        { name: "above", id: 2, start_i: -1, start_j: 0 },
        { name: "below", id: 3, start_i: 1, start_j: 0 },
        { name: "left", id: 0, start_i: 0, start_j: -1 },
        { name: "right", id: 1, start_i: 0, start_j: 1 },
    ]
    for (let i = 0; i < wefts; i++) {
        for (let j = 0; j < warps; j++) {
            const face = getFace({ i, j, id: 0 }, warps, cns);
            const layer = getLayer({ i, j, id: 0 }, warps, cns);

            for (const region of regions) {

                //find the next next acn above that shares the layer
                const ij = getNextCellOnLayer(i, j, wefts, warps, layer, region.name, cns)

                if (ij == null) {
                    cns = setNodeType({ i, j, id: region.id }, warps, cns, 'ECN')
                } else {
                    const last_face = getFace({ i: ij.i, j: ij.j, id: 0 }, warps, cns)
                    cns = classifyNodeTypeBasedOnFaces(face, last_face, { i, j, id: region.id }, warps, cns);

                }

                //ADD ANY REQUIRED VIRTUAL NODES for FULL WIDTH RENDERING
                const ndx = { i, j, id: region.id };
                if (!sim.wefts_as_written) {
                    switch (region.name) {
                        case "above":
                            if (i == 0 && getNodeType(ndx, warps, cns) !== 'ACN') setNodeType(ndx, warps, cns, 'VCN')
                            break;

                        case "below":
                            if (i == wefts - 1 && getNodeType(ndx, warps, cns) !== 'ACN') setNodeType(ndx, warps, cns, 'VCN')
                            break;

                        case "left":
                            if (j == 0 && getNodeType(ndx, warps, cns) !== 'ACN') setNodeType(ndx, warps, cns, 'VCN')
                            break;

                        case "right":
                            if (j == warps - 1 && getNodeType(ndx, warps, cns) !== 'ACN') setNodeType(ndx, warps, cns, 'VCN')
                            break;
                    }


                }
            }
        }
    }
    return cns;

}


export const pullRows = (d: Draft, paths: Array<WeftPath>, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {

    for (let i = 0; i < wefts(d.drawdown); i++) {
        const path = getWeftPath(paths, d.rowSystemMapping[i], d.rowShuttleMapping[i]);
        if (path != null) {
            cns = pullRow(i, wefts(d.drawdown), warps(d.drawdown), path.pics, cns);
        }
    }

    return cns;
}




/** checks this row against the last row of the same material and system type and sees if the edge will interlace. If not, it removes any ACNs that would be pulled out in this pic */
export const pullRow = (i: number, wefts: number, warps: number, prev_i_list: Array<number>, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {

    if (prev_i_list.length == 0) return cns;


    //get only picks in this list that have valid. 
    const valid_pics = prev_i_list.filter(el => rowHasActiveCNs(el, warps, cns));
    const ndx = valid_pics.findIndex(el => el == i);



    if (ndx == -1) return cns;

    const direction = ndx % 2 == 1; //true means the previous row went from left to right
    const starting_j = (direction) ? warps - 1 : 0; //if true, we start on the right (where the last row ended)

    let obj: { cns: Array<ContactNeighborhood>, next_j: number } = determineEdgeBehavior(ndx, starting_j, valid_pics, warps, direction, cns);
    cns = obj.cns;

    while (obj.next_j !== -1 && obj.next_j < warps && obj.next_j >= 0) {

        obj = determineEdgeBehavior(ndx, obj.next_j, valid_pics, warps, direction, cns);
        cns = obj.cns;

    }


    // console.log("AFTER i ", i);
    // printYValues(cns, wefts, warps, false);
    return cns;
}


export const printFloats = (floats: Array<{ id: number, float: CNFloat, touched: boolean }>) => {
    for (const f of floats) {
        const printstring = `FLOAT ${f.id} (${f.float.left.i}, ${f.float.left.j}) to (${f.float.right.i}, ${f.float.right.j}) ${f.touched ? "TOUCHED" : "NOT TOUCHED"}`;
        console.log(printstring);
    }
}

/**
* starting with the longest warp, this function searches for all the floats that would be affected (and then would subsequently affect others, if that warp was lifted) the degree or (height) to which it is lifted is specified by the "lift-limit" param in SimulationVars. This assigns layers sequentially, with 1 meaning it is the top layer (looking down on the cloth from above), 2 is the next layer under, 3 is under 2 and so on. a value of 0 means that that this CN was never visited by the algorithm. This function is called recursively as long as there are still floats to analyze. 
* @param wefts 
* @param warps 
* @param layer 
* @param cns 
* @param sim 
* @returns 
*/
export const isolateLayers = (wefts: number, warps: number, layer: number, cns: Array<ContactNeighborhood>, sim: SimulationVars): Array<ContactNeighborhood> => {


    //get weft floats; 
    let floats: Array<CNFloat> = [];

    for (let i = 0; i < wefts; i++) {
        floats = floats.concat(getRowAsFloats(i, warps, cns).filter(float => !float.face));
    }

    for (let j = 0; j < warps; j++) {
        floats = floats.concat(getColAsFloats(j, wefts, warps, cns).filter(float => float.face));
    }

    floats = floats.filter(el => getLayer(el.left, warps, cns) == 0);


    const floats_with_id = floats.map((el, ndx) => { return { id: ndx, float: el, touched: false } });

    if (floats_with_id.length == 0) return cns;

    const longest_warp = floats
        .reduce((acc, el, ndx) => {
            if (el.face) {
                const len = getWarpFloatLength(el, wefts) + 1;
                if (len >= acc.len) {
                    acc.len = len;
                    acc.id = ndx;
                }
            }
            return acc;
        }, { len: 0, id: -1 })


    //internally recursive function that updates the float list
    function liftFloat(float: CNFloat, float_ndx: number) {

        const float_obj = floats_with_id[float_ndx];

        if (float_obj.touched == true) return;

        float_obj.touched = true;

        let attached: Array<number> = [];

        //*IMPORTANT: we need to lift the floats by the limit * the layer + 1 because as we go down layers, the spacing between each warp is wider (because it includes warps on other layers and thus, needs to be adjusted)
        attached = getFloatsAffectedByLifting(float_ndx, floats_with_id, wefts, warps, (sim.lift_limit * (layer + 1)), cns);

        if (attached.length == 0) return;


        for (let a = 0; a < attached.length; a++) {
            const float_ndx = attached[a];
            const a_float: CNFloat = floats_with_id[float_ndx].float;
            if (float_ndx !== -1) liftFloat(a_float, float_ndx);
        }
    }


    //pull up on the longest warp float, see what moves with it. 
    liftFloat(floats[longest_warp.id], longest_warp.id);


    //console.log("**** LIFTING COMPLETE ****")
    for (const f of floats_with_id) {
        if (f.touched) {
            cns = setFloatZ(f.float, wefts, warps, layer, cns);
        }
    }
    cns = updateCNs(cns, wefts, warps, sim);
    //printLayerMap(cns, wefts, warps);
    //printCNs(cns, wefts, warps);
    return isolateLayers(wefts, warps, ++layer, cns, sim)
}



/**
 * this will read through a current drawdown and populate the information needed for the contact neighborhoods, determining if and how different wefts stack or slide, etc. This will change based on the behavior of the wefts so we do need some information here if the simulation should assume the wefts run full width or if we want to simulate as drafted (where, if there isn't a selvedge, some might pull out) 
 * @param dd 
 * @param cns 
 * @param sim variables to control how the parsing takes place (e.g. specifically if you want to render the draft as it would be woven vs forcing it to go full width)
 * @returns 
 */
const parseDrawdown = (d: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars): Promise<Array<ContactNeighborhood>> => {

    // console.log("**************** NEW DRAFT LOADED **************", d)

    let paths: Array<WeftPath> = initWeftPaths(d);
    paths = parseWeftPaths(d, paths);

    const dd = d.drawdown;

    //START BY POPULATING THE CNS MAPS
    cns = updateCNs(cns, wefts(d.drawdown), warps(d.drawdown), sim);


    if (sim.wefts_as_written) {
        cns = pullRows(d, paths, cns);
        //update CNS after pull to reset warp aligned ACNS
        cns = updateCNs(cns, wefts(d.drawdown), warps(d.drawdown), sim);
    }

    if (sim.use_layers) cns = isolateLayers(wefts(dd), warps(dd), 1, cns, sim);


    cns = packPicks(wefts(dd), warps(dd), cns);

    return Promise.resolve(cns);
}



/**
 * update this to contact neighborhood 
 */
export const getDraftTopology = async (draft: Draft, sim: SimulationVars): Promise<Array<ContactNeighborhood>> => {

    return initContactNeighborhoods(draft.drawdown)
        .then(cns => {
            return parseDrawdown(draft, cns, sim);
        });
}


// RENDERING TOPOLOGY TO VERTEX


/**
 * if every row is packed at the same packing force, then the fell line created by a straight beater would be represented by the maximum y value;  Y values represent the center of teh material. 
 * @param vtxs 
 * @returns the y value represented by the top edge of the last weft inserted and packed. 
 */
const getFellY = (vtxs: Array<YarnVertex>, diameter: number): number => {
    const max_y = vtxs.reduce((acc, el) => {
        if (el.y > acc) return el.y;
        return acc;
    }, 0);
    return max_y + diameter / 2;

}

/**
 * looks at the move number of the current node and determines, based on the nodes this is connected to, how far is should actually move from it's relationship to neighboring interlacements. This could be more sophisticated (but right now it returns the max over a window of a given size). 
 * @param ndx 
 * @param cns 
 */
// const calcYOffset = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, simVars: SimulationVars): number => {

//     const max_dist = 10; //the distance at which one weft would NOT affect another
//     const mvy = getMvY(ndx, warps, cns);

//     const j_dist = simVars.warp_spacing;  //the distance traveled for each j
//     const j_check = Math.floor((max_dist / j_dist) / 2);
//     const left = (simVars.wefts_as_written) ? ndx.j - j_check : modStrict(ndx.j - j_check, warps);
//     const right = (simVars.wefts_as_written) ? ndx.j + j_check : modStrict(ndx.j + j_check, warps);
//     const j_left = Math.min(left, right);
//     const j_right = Math.max(left, right);

//     // console.log("J, J LEFT, J RIGHT ", ndx.j, j_left, j_right)
//     const row = cns.filter(
//         el => el.ndx.i == ndx.i
//             && el.node_type == "ACN"
//             && el.ndx.j >= j_left
//             && el.ndx.j <= j_right
//     );

//     //row should have at least i
//     // console.log("ROW ", row);

//     // let sum:number = row.reduce((acc, el) => {
//     //   acc += el.mv.y;
//     //   return acc;
//     // }, 0);

//     // return sum / row.length;

//     const min: number = row.reduce((acc, el) => {
//         if (acc < el.mv.y) acc = el.mv.y;
//         return acc;
//     }, mvy);

//     return min;



// }
/**
 * converts the information for the CN into a vertex using the information from the CNs as well as the simulation variables. 
 * x is a function of:
 *      j - the warp number
 *      d - the warp position based on the user specified density
 *      w - warp material width
 *      c - contact point (true for left side of teh warp, false for right)
**/

export const calcX = (j: number, d: number, w: number, left: boolean): number => {

    const basis = j * d;
    const adj = (left) ? basis - w / 2 : basis + w / 2;
    return adj;


};


// y is a function of: 
//  *      f - the current position of the fell line
//  *      b - the strength of the beat (0, 1)
//  *      p - the proximity of this vertex to the crossing of it's float with another float the closer the cross to this point, the more it will "repel" the previous warp (which is, itself, a function of warp density)
//  *      max_dist the farthest this weft and be away from the fell. 
// export const calcY = (f: number, b: number, float: CNFloat, crossing_float: CNFloat, max_dist: number, vtx_list: Array<YarnVertex>): number => {

//     //const max_pos = f + max_dist;

//     //get the distance from this ndx (in this current vertex space to the float it crosses. 
//     //get intersection in 2D space of two lines 








// }


/**
 * converts the information for the CN into a vertex using the information from the CNs as well as the simulation variables. 
 * x is a function of:
 *      d - the warp position based on the user specified density
 * y is a function of: 
 *      t - the tautness of the inserted weft
 *      f - the current position of the fell line
 *      p - the proximity of this vertex to the crossing of it's float with another float the closer the cross to this point, the more it will "repel" the previous warp (which is, itself, a function of warp density)
 * z is a function of: 
 *      l - the layer number associated with this ACN. 
 *      f - the face (or size) of the warp it sits upon. 
 *      diam - the warp and weft diameter
 *  
 * @param ndx 
 * @param d 
 * @param vtxs 
 * @param cns 
 * @param sim 
 * @returns 
 */
const createVertex = (ndx: CNIndex, fell: number, d: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars): YarnVertex => {



    /// REDONE CODe


    const width = warps(d.drawdown);
    const weft_material_id = d.rowShuttleMapping[ndx.i];
    const weft_diameter = getDiameter(weft_material_id, sim.ms);
    const warp_material_id = d.colShuttleMapping[ndx.j];
    const warp_diameter = getDiameter(warp_material_id, sim.ms);



    //this is a function of EPI, warp diameter and weft diameter, but for now, we'll be sloppy
    // const interlacement_space = weft_diameter;

    const pack_factor = (1 - sim.pack / 100);

    // const mvy = getMvY(ndx, width, cns);

    //let max_row_mat_diameter = weft_diameter;

    // for (let i = 0; i < mvy; i++) {
    //     //get each material that this could theoretically slide over or under
    //     let row_mat_diameter = 0;
    //     if (ndx.i - i >= 0) row_mat_diameter = d.rowShuttleMapping[ndx.i - i];
    //     if (row_mat_diameter > max_row_mat_diameter) max_row_mat_diameter = row_mat_diameter;
    // }


    //Each ACN has a MY number, which represents how far this weft *can* slide but not neccessarily how it does slide. This calculates how far it can slide based on it's relationships to it's neighbors and their sliding 

    //const y_offset = calcYOffset(ndx, width, cns, sim);
    //const mobility = (y_offset > 1) ? -1 : -y_offset; //clamp this value to -1

    //if pack_factor is 0 (no packing) this weft should sit at fell-line + diameter/2
    //if pack factor is 1 (max packing) this weft can sit  fell-line - max_y_displacement. Max y displacement is a function of the yarns that are stacking at this specific location. 


    // const max_min = {
    //     max: fell + weft_diameter + interlacement_space,
    //     min: fell + (max_row_mat_diameter / 2) * mobility + weft_diameter / 2
    // };
    //const y = interpolate(pack_factor, max_min);


    //let the layer first
    let z = getLayer(ndx, width, cns) * sim.layer_spacing * -1;
    //then adjust for which side of the warp it is sitting upon. 
    if (getFace(ndx, width, cns)) z -= warp_diameter;
    else z += warp_diameter;




    let x = sim.warp_spacing * ndx.j;
    if (ndx.id == 0) x -= warp_diameter;
    if (ndx.id == 1) x += warp_diameter;


    return { ndx, x, y, z }


}

/**
 * initializes a list of vertexes for every unique system-material combination used in this draft
 * @param d 
 */
export const initWeftPaths = (d: Draft): Array<WeftPath> => {

    const weft_paths: Array<WeftPath> = [];

    for (let i = 0; i < wefts(d.drawdown); i++) {
        const system = d.rowSystemMapping[i];
        const material = d.rowShuttleMapping[i];
        const path = weft_paths.find(el => el.system == system && el.material == material)
        if (path == undefined) {
            weft_paths.push({ system, material, vtxs: [], pics: [] });
        }

    }
    return weft_paths;

}


/**
 * populates the "pics" field of the weftPaths by mapping system/material combinations to the pics upon which they occur
 * @param d the draft we are using to populate the WeftPaths
 * @param paths the newly created (should be empty) list of weft paths
 * @returns the paths with their 'pics' field updated. 
 */
export const parseWeftPaths = (d: Draft, paths: Array<WeftPath>): Array<WeftPath> => {

    for (let i = 0; i < wefts(d.drawdown); i++) {
        const material = d.rowShuttleMapping[i];
        const system = d.rowSystemMapping[i];
        const path = paths.find(el => el.material == material && el.system == system);
        if (path == undefined) {
            console.error('no path found for material and system ');
            return [];
        }
        path.pics.push(i);
    }

    return paths;
}

export const getFlatVtxList = (paths: Array<WeftPath>): Array<YarnVertex> => {
    //collapse the paths into a flat list
    return paths.reduce((acc: Array<YarnVertex>, el) => {
        acc = acc.concat(el.vtxs);
        return acc;
    }, []);
}

export const getWeftPath = (paths: Array<WeftPath>, system: number, material: number): WeftPath | null => {
    return paths.find(el => el.material == material && el.system == system) ?? null;
}




const getYFromWeft = (i: number, j: number, cns: Array<ContactNeighborhood>, paths: Array<WeftPath>) => {

    //first, check if this index exists in the path already
    let active_path = null;
    for (const path of paths) {
        if (path.pics.find(pic => pic == i) !== undefined)
            active_path = path;
    }
    if (active_path !== null) {
        //get all the vertexes associated with this weft. 
        const vtx_list = active_path.vtxs.filter(vtx => vtx.ndx.i == i);
        const closest = vtx_list.reduce((acc, el) => {
            let dist = j - el.ndx.j;
            if (dist == 0) {
                acc.dist_left = dist;
                acc.dist_right = dist;
                acc.j_left = el.ndx.j;
                acc.j_right = el.ndx.j;
                acc.y_left = el.y;
                acc.y_right = el.y;

            } else if (dist > 0) {
                if (dist < acc.dist_left) {
                    acc.dist_left = dist;
                    acc.j_left = el.ndx.j;
                    acc.y_left = el.y;
                }
            } else {
                dist = Math.abs(dist);
                if (dist < acc.dist_right) {
                    acc.dist_right = dist;
                    acc.j_right = el.ndx.j;
                    acc.y_right = el.y;

                }
            }

            return acc;
        }, { dist_left: 10000, j_left: -1, y_left: 0, dist_right: 10000, j_right: -1, y_right: 0 });


        return closest.y_left + closest.y_right / 2;

    } else {
        return 0;
    }


}


const getWarpACNS = (j: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    return cns.filter(el => el.ndx.j == j && el.node_type == 'ACN' && (el.ndx.id == 2 || el.ndx.id == 3));
}

export const renderWarps = (draft: Draft, cns: Array<ContactNeighborhood>, weft_paths: Array<WeftPath>, sim: SimulationVars): Promise<Array<WarpPath>> => {

    const warp_paths: Array<WarpPath> = [];
    const width = warps(draft.drawdown);

    for (let j = 0; j < width; j++) {

        const x = j * sim.warp_spacing;
        const vtxs: Array<YarnVertex> = [];
        const system = draft.colSystemMapping[j];
        const material = draft.colShuttleMapping[j];

        const acns = getWarpACNS(j, cns);

        for (const cn of acns) {
            const z = cn.layer * sim.layer_spacing * -1;
            const y = getYFromWeft(cn.ndx.i, j, cns, weft_paths);
            vtxs.push({ x, y, z, ndx: cn.ndx });

        }

        //push the ends:
        if (vtxs.length > 0) {
            vtxs.unshift({ x: vtxs[0].x, y: -2 * getDiameter(material, sim.ms), z: vtxs[0].z, ndx: { i: 0, j, id: 3 } });
            vtxs.push({ x: vtxs[vtxs.length - 1].x, y: wefts(draft.drawdown) * getDiameter(material, sim.ms), z: vtxs[vtxs.length - 1].z, ndx: { i: wefts(draft.drawdown) - 1, j, id: 2 } });
        } else {
            vtxs.push({ x, y: -2 * getDiameter(material, sim.ms), z: 0, ndx: { i: 0, j, id: 3 } });
            vtxs.push({ x, y: wefts(draft.drawdown) * getDiameter(material, sim.ms), z: 0, ndx: { i: wefts(draft.drawdown) - 1, j, id: 2 } });
        }

        warp_paths.push({ system, material, vtxs })




        // for(let i = 0; i < wefts(draft.drawdown); i++){
        //   let type_top = getNodeType({i, j, id: 2}, width, cns);
        //   let type_bottom = getNodeType({i, j, id: 3}, width, cns);
        //   console.log("NODE TYPE AT ", i, j, " is ", type_top, type_bottom, )
        //   if(type_top == 'ACN' || type_top == 'VCN' || type_bottom == 'ACN' || type_bottom == 'VCN'){

        //     let z = getMvZ({i, j, id: 2}, width, cns) * sim.layer_spacing * -1;
        //     let y = getYFromWeft(i, j, cns, weft_paths);
        //     vtxs.push({x, y, z, ndx:{i, j, id:2}});

        //   }
        // }
    }

    return Promise.resolve(warp_paths);



}
/**
 * converts a topology diagram to a list of weft vertexes to draw. It only draws key interlacements to the list
 * @param draft 
 * @param topo 
 * @param layer_map 
 * @param sim 
 * @returns 
 */
export const followTheWefts = (draft: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars): Promise<Array<WeftPath>> => {
    const warpnum = warps(draft.drawdown);

    //get a list of the unique system-material combinations of this weft. 
    const paths: Array<WeftPath> = initWeftPaths(draft);
    let fell_y = 0;

    //parse row by row, then assign to the specific path to which this belongs
    for (let i = 0; i < wefts(draft.drawdown); i++) {


        const system = draft.rowSystemMapping[i];
        const material = draft.rowShuttleMapping[i];
        const path = getWeftPath(paths, system, material);


        const flat_vtx_list = getFlatVtxList(paths);

        if (path === undefined || path === null) {
            return Promise.reject("weft path with system and material not found");
        }
        const direction = (path.pics.length % 2 == 0);  //true is left to right, false is 
        const temp_pic: Array<YarnVertex> = [];

        if (direction) {
            //left to right - 

            for (let j = 0; j < warpnum; j++) {

                if (getNodeType({ i, j, id: 0 }, warpnum, cns) == 'ACN') {
                    const vtx = createVertex({ i, j, id: 0 }, fell_y, draft, cns, sim);
                    temp_pic.push(vtx);
                }

                if (getNodeType({ i, j, id: 1 }, warpnum, cns) == 'ACN') {
                    const vtx = createVertex({ i, j, id: 1 }, fell_y, draft, cns, sim);
                    temp_pic.push(vtx);
                }
            }

        } else {

            for (let j = warpnum - 1; j >= 0; j--) {
                if (getNodeType({ i, j, id: 1 }, warpnum, cns) == 'ACN') {
                    const vtx = createVertex({ i, j, id: 1 }, fell_y, draft, cns, sim);
                    temp_pic.push(vtx);
                }

                if (getNodeType({ i, j, id: 0 }, warpnum, cns) == 'ACN') {
                    const vtx = createVertex({ i, j, id: 0 }, fell_y, draft, cns, sim);
                    temp_pic.push(vtx);
                }
            }
        }


        //IF WE ARE RENDERING FULL WIDTH, add the VCNS and make sure they match the layer of the weft. 
        if (!sim.wefts_as_written) {
            let left: YarnVertex | null = null;
            let right: YarnVertex | null = null;
            const last_ndx = temp_pic.length - 1;

            if (temp_pic.length > 0) {

                //set it to the layer for this weft
                const left_ndx = { i, j: 0, id: 0 };
                if (getNodeType(left_ndx, warpnum, cns) !== 'ACN') {
                    cns = setLayer(left_ndx, warpnum, cns, getLayer(temp_pic[0].ndx, warpnum, cns));
                    left = createVertex(left_ndx, fell_y, draft, cns, sim);
                }

                //set it to the layer for this weft
                const right_ndx = { i, j: warpnum - 1, id: 1 };
                if (getNodeType(right_ndx, warpnum, cns) !== 'ACN') {
                    cns = setLayer(right_ndx, warpnum, cns, getLayer(temp_pic[last_ndx].ndx, warpnum, cns));
                    right = createVertex(right_ndx, fell_y, draft, cns, sim);
                }

            }

            if (direction) {
                if (left !== null) temp_pic.unshift(left);
                if (right !== null) temp_pic.push(right);
            } else {
                if (right !== null) temp_pic.unshift(right);
                if (left !== null) temp_pic.push(left);
            }
        }


        path.vtxs = path.vtxs.concat(temp_pic);
        path.pics.push(i);
        fell_y = getFellY(flat_vtx_list.concat(path.vtxs), getDiameter(material, sim.ms));
    }
    return Promise.resolve(paths);


}


export const calcClothHeightOffsetFactor = (diam: number, radius: number, offset: number): number => {
    return diam * (radius - offset) / radius;
}

/** CODE DEVOTED TO MASS-SPRING-CALC */

// export const createParticle = (x: number, y: number, z: number, pinned: boolean): Particle => {
//     const position = new THREE.Vector3(x, y, z);
//     const geometry = new THREE.SphereGeometry(0.1, 16, 16);
//     const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })

//     const acceleration: THREE.Vector3 = new THREE.Vector3();


//     const p = {
//         position,
//         previousPosition: position.clone(),
//         geometry,
//         material,
//         mesh: new THREE.Mesh(geometry, material),
//         acceleration,
//         pinned
//     }

//     p.mesh.position.copy(position)
//     return p;
// }

// export const applyForce = (p: Particle, force: THREE.Vector3): Particle => {
//     p.acceleration.add(force);
//     return p;
// }

// export const verlet = (p: Particle, damping: number, timeStep: number): Particle => {
//     if (p.pinned) return p;

//     const velocity = p.position.clone().sub(p.previousPosition).multiplyScalar(damping)

//     const newPos = p.position.clone().add(velocity).add(p.acceleration.clone().multiplyScalar(timeStep ** 2));

//     p.previousPosition.copy(p.position);
//     p.position.copy(newPos);
//     p.acceleration.set(0, 0, 0);

//     return p;

// }

// export const updateParticleMesh = (p: Particle): Particle => {
//     p.mesh.position.copy(p.position);
//     return p;
// }

// export const createSpring = (p1: Particle, p2: Particle, restLength: number, color: number, diameter: number
// ): Spring => {

//     const spring = {
//         pts: [],
//         mesh: null,
//         p1, p2, restLength, color, diameter
//     }

//     spring.pts.push(new THREE.Vector3(p1.position.x, p1.position.y, p1.position.z));

//     spring.pts.push(new THREE.Vector3(p2.position.x, p2.position.y, p2.position.z));

//     //const curve = new THREE.CatmullRomCurve3(spring.pts, false, 'catmullrom', .1);

//     //const geometry = new THREE.TubeGeometry( curve, 2, 1, 8, false );
//     const geometry = new THREE.BufferGeometry().setFromPoints(spring.pts);
//     const material = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Green line

//     // const material = new THREE.MeshPhysicalMaterial( {
//     //       color: color,
//     //       depthTest: true,
//     //       emissive: 0x000000,
//     //       metalness: 0,
//     //       roughness: 0.5,
//     //       clearcoat: 1.0,
//     //       clearcoatRoughness: 1.0,
//     //       reflectivity: 0.0
//     //   } ); 

//     spring.mesh = new THREE.Line(geometry, material)
//     //spring.mesh = new THREE.Mesh(geometry, material);

//     return spring;


// }

// export const satisfyConstraint = (s: Spring): Spring => {
//     const delta = s.p2.position.clone().sub(s.p1.position);
//     const dist = delta.length();
//     const diff = (dist - s.restLength) / dist;
//     const correction = delta.multiplyScalar(0.5 * diff);

//     if (!s.p1.pinned) s.p1.position.add(correction);
//     if (!s.p2.pinned) s.p2.position.sub(correction);

//     return s;
// }

// export const updateSpringMesh = (s: Spring): Spring => {
//     s.mesh.position.copy(s.p1.position);

//     const vertices = s.mesh.geometry.attributes.position.array;
//     vertices[0] = s.p1.position.x;
//     vertices[1] = s.p1.position.y;
//     vertices[2] = s.p1.position.z;

//     vertices[3] = s.p2.position.x;
//     vertices[4] = s.p2.position.y;
//     vertices[5] = s.p2.position.z;

//     s.mesh.geometry.attributes.position.needsUpdate = true;

//     return s;
// }

// DEBUGGING FUNCTIONS

export const printLayerMap = (cns: Array<ContactNeighborhood>, wefts: number, warps: number) => {

    let layer_map = "";
    for (let i = 0; i < wefts; i++) {
        const row = [];
        for (let j = 0; j < warps; j++) {
            row.push(getLayer({ i, j, id: 0 }, warps, cns));
        }
        //layer_map.push(row);
        const row_as_string = row.join(" ");
        layer_map += row_as_string + "\n";
    }

    console.log("LAYER MAP \n", layer_map)

}



export const printCNs = (cns: Array<ContactNeighborhood>, wefts: number, warps: number) => {

    //each CN should be printed as:
    //  . A . 
    //  V + P
    //  . E .


    let row_ln_1 = ""
    let row_ln_2 = "";
    let row_ln_3 = "";

    for (let i = 0; i < wefts; i++) {
        row_ln_1 = `  `;
        row_ln_2 = `${i} `;
        row_ln_3 = `  `;
        for (let j = 0; j < warps; j++) {
            let cn_l = getNodeType({ i, j, id: 0 }, warps, cns).substring(0, 1);
            let cn_r = getNodeType({ i, j, id: 1 }, warps, cns).substring(0, 1);
            let cn_t = getNodeType({ i, j, id: 2 }, warps, cns).substring(0, 1);
            let cn_b = getNodeType({ i, j, id: 3 }, warps, cns).substring(0, 1);

            if (cn_l == "P") cn_l = "-";
            if (cn_r == "P") cn_r = "-";
            if (cn_t == "P") cn_t = "|";
            if (cn_b == "P") cn_b = "|";

            row_ln_1 += `   ${cn_t}   `;
            row_ln_2 += ` ${cn_l} + ${cn_r} `;
            row_ln_3 += `   ${cn_b}   `;
        }
        console.log(row_ln_1 + "\n" + row_ln_2 + "\n" + row_ln_3 + "\n");

    }
}


export const printYValues = (cns: Array<ContactNeighborhood>, wefts: number, warps: number, mode: boolean) => {


    console.log((mode) ? "SHOWING WEFT TYPES" : "SHOWING WARP TYPES")
    const layer_map = [];
    for (let i = 0; i < wefts; i++) {
        const row = [];
        for (let j = 0; j < warps; j++) {

            if (mode) {
                row.push(getLayer({ i, j, id: 0 }, warps, cns) + "-" + getNodeType({ i, j, id: 0 }, warps, cns) + ", " + getLayer({ i, j, id: 1 }, warps, cns) + "-" + getNodeType({ i, j, id: 1 }, warps, cns));
            } else {
                row.push(getLayer({ i, j, id: 2 }, warps, cns) + "-" + getNodeType({ i, j, id: 2 }, warps, cns) + ", " + getLayer({ i, j, id: 3 }, warps, cns) + "-" + getNodeType({ i, j, id: 3 }, warps, cns));
            }


        }
        layer_map.push(row);
    }

    // console.log("Y Values MAP ", layer_map)

}
