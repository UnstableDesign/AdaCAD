
//import * as THREE from 'three';
import { Draft, Drawdown, getCellValue, warps, wefts } from "../draft";
import { getDiameter, getMaterialStretch, Material } from "../material";
import { filterToUniqueValues, interpolate, modStrict } from "../utils";
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
export const computeSimulationData = async (draft: Draft, simVars: SimulationVars, topo?: Array<ContactNeighborhood>, floats?: Array<CNFloat>, wefts?: Array<WeftPath>, warps?: Array<WarpPath>): Promise<SimulationData> => {

    const simData: SimulationData = {
        draft: draft,
        topo: topo ?? [],
        wefts: wefts ?? [],
        warps: warps ?? []
    };

    if (simData.topo.length == 0) {
        simData.topo = await getDraftTopology(simData.draft, simVars);

    }

    if (simData.wefts.length == 0)
        simData.wefts = await followTheWefts(simData.draft, simData.topo, simVars);

    if (simData.warps.length == 0)
        simData.warps = await placeWarps(simData.draft, simData.wefts, simVars);

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


export const layerNotSet = (i: number, j: number, id: number, warps: number, cns: Array<ContactNeighborhood>): boolean => {
    const cn_left = getCN({ i, j, id: 0 }, warps, cns);
    const cn_right = getCN({ i, j, id: 1 }, warps, cns);
    const cn_top = getCN({ i, j, id: 2 }, warps, cns);
    const cn_bottom = getCN({ i, j, id: 3 }, warps, cns);
    if (cn_top.layer == 0 && cn_bottom.layer == 0 && cn_left.layer == 0 && cn_right.layer == 0) {
        return true;
    }
    return false;
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
 * TODO - update this function to consider layers. 
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
                    id: -1,
                    left: left.ndx,
                    right: right.ndx,
                    edge: false,
                    face: left.face,
                    blocking: []
                })
            }
        }

        if (!found) {
            const right = rights.shift();
            if (right !== undefined) {
                floats.push({
                    id: -1,
                    left: left.ndx,
                    right: { i: right.ndx.i, j: warps + right.ndx.j, id: 1 }, //get the first in the list
                    edge: false,
                    face: left.face,
                    blocking: []
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
                    id: -1,
                    left: left.ndx,
                    right: right.ndx,
                    edge: false,
                    face: left.face,
                    blocking: []
                })
            }
        }

        if (!found) {
            const right = rights.shift();
            if (right !== undefined) {
                floats.push({
                    id: -1,
                    left: left.ndx,
                    right: { j: right.ndx.j, i: wefts + right.ndx.i, id: 3 }, //get the first in the list
                    edge: false,
                    face: left.face,
                    blocking: []
                })
            }
        }


    })

    return floats;


}



const checkWarpIndexInRange = (i: number, j: number, wefts: number, float: CNFloat): boolean => {
    if (float.face == false || float.face == null) return false;
    if (float.left.j !== j) return false;

    if (float.right.i < wefts) {
        return i >= float.left.i && i <= float.right.i;
    } else {
        return (i >= 0 && i <= modStrict(float.right.i, wefts)) || (i >= float.left.i && i < wefts);
    }


}

/**
 * given a point, this function returns the float upon which this point sits
 * @param i 
 * @param j 
 */
const getWarpFloat = (i: number, j: number, wefts: number, warps: number, all_floats: Array<CNFloat>): CNFloat | null => {
    i = modStrict(i, wefts);
    j = modStrict(j, warps);

    //CHECK TO MAKE SURE THIS WORKS ON WRAPPING WARP FLOATS
    const res = all_floats.filter(el => checkWarpIndexInRange(i, j, wefts, el));
    if (res.length == 0) {
        // console.error("a warp float was not found with this index ")
        return null;
    } else if (res.length > 1) {
        console.error("a warp float returned multiple possible associations ")
        return null;
    } else {
        if (res[0].face == null) return null;
    }
    return res[0];
}

/**
 * checks both float positions to determine if and how they are wrapping edges. If both warp or do not, no changes need to be made
 * if one wraps and the other doesn't we need to check if we need to shift the unwrapped float to match. this is only required if the two warps aren't attached automatically.
 * @param ar - the right edge of the attached float
 * @param al - the left edge of the attached float
 * @param fr - the right edge of the float
 * @param fl - the left edge of the float
 * @param warps - the number of warps in the draft
 * @returns 
 */

const alignCoordinates = (ar: number, al: number, fr: number, fl: number, warps: number): { ar: number, al: number, fr: number, fl: number } => {
    const float_wraps = fr >= warps;
    const attached_wraps = ar >= warps;

    if (float_wraps) {
        if (attached_wraps) {
            //A && B

        } else {
            //A && !B

            if (!(ar >= fl && al <= fr)) {
                ar += warps;
                al += warps;
            }
        }

    } else {
        //!A && B
        if (attached_wraps) {
            if (!(ar >= fl && al <= fr)) {
                fr += warps;
                fl += warps;
            }
        }

    }
    return { ar, al, fr, fl };

}



/**
 * checks if the point i, j resides on the float. 
 * @param i 
 * @param j 
 * @param warps 
 * @param float 
 * @returns 
 */
const checkWeftIndexInRange = (j: number, warps: number, float: CNFloat): boolean => {
    if (float.face == null) return false;

    const obj = alignCoordinates(float.right.j, float.left.j, j, j, warps);
    return obj.fl >= obj.al && obj.fr <= obj.ar;

}

/**
 * given a point, this function returns the float upon which this point sits
 * @param i any number, will mod by wefts to force in range. 
 * @param j any number, will mod by warps to force in range. 
 */

export const getWeftFloat = (i: number, j: number, wefts: number, warps: number, all_floats: Array<CNFloat>): CNFloat | null => {

    i = modStrict(i, wefts);
    j = modStrict(j, warps);


    const res = all_floats.filter(el => el.left.i == i && checkWeftIndexInRange(j, warps, el));
    if (res.length == 0) {
        // console.error("a warp float was not found with this index ");
        return null;
    } else if (res.length > 1) {
        console.error("a warp float returned multiple possible associations ")
        return null;
    } else {
        if (res[0].face == null) return null;
    }
    return res[0];

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
 * given a float, check if there are any other floats that share an edge with this float on the row specified by i.
 * @param i 
 * @param float 
 * @param warps 
 * @param all_floats 
 * @returns 
 */
export const getAttachedFloats = (i: number, float: CNFloat, warps: number, all_floats: Array<CNFloat>): Array<CNFloat> => {

    const attached: Array<CNFloat> = [];

    //get all floats with a matching face
    const row_floats = all_floats
        .filter(el => el.face == float.face)
        .filter(el => el.left.i == i);


    row_floats.forEach(el => {
        let found = false;
        for (let j = el.left.j; j <= el.right.j; j++) {
            const in_range = checkWeftIndexInRange(j, warps, float);
            if (in_range) found = true;
        }
        if (found) attached.push(el);
    });

    return attached;



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
export const getUntouchedFloatsInRange = (i: { l: number, r: number }, j: { l: number, r: number }, all_floats: Array<{ id: number, float: CNFloat; touched: boolean }>, wefts: number, warps: number): Array<number> => {


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

            const weft = getWeftFloat(adj_i, adj_j, wefts, warps, all_floats.map(f => f.float));
            if (weft !== null) candidates.push(weft);

            const warp = getWarpFloat(adj_i, adj_j, wefts, warps, all_floats.map(f => f.float));
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
export const getFloatsAffectedByLifting = (id: number, all_floats: Array<{ id: number, float: CNFloat; touched: boolean }>, wefts: number, warps: number, limit: number) => {

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


    attached = getUntouchedFloatsInRange(i_range, j_range, all_floats, wefts, warps);
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

/**
 * this function updates the ACNs of the floats associated with a given layer by setting the layer of the ACN at the edges 
 * (e.g ids 0 and 1 for weft floats or ids 2 and 3 for warp floats)
 * it then also adds the pair of that ACN to the same layer. 
 * @param float 
 * @param wefts 
 * @param warps 
 * @param layer 
 * @param cns 
 * @returns 
 */
const setFloatACNS = (float: CNFloat, wefts: number, warps: number, layer: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    //lift the entire float: 
    if (float.face) {

        const left_ndx = { i: modStrict(float.left.i, wefts), j: modStrict(float.left.j, warps), id: 2 };
        if (getNodeType(left_ndx, warps, cns) !== 'ACN') console.error("LEFT NDX of float NOT AN ACN", left_ndx);

        const left_pair_ndx = { i: modStrict(float.left.i - 1, wefts), j: modStrict(float.left.j, warps), id: 3 };
        if (getNodeType(left_pair_ndx, warps, cns) !== 'ACN') console.error("LEFT PAIR NDX of float NOT AN ACN", left_pair_ndx, getNodeType(left_pair_ndx, warps, cns));

        const right_ndx = { i: modStrict(float.right.i, wefts), j: modStrict(float.right.j, warps), id: 3 };
        if (getNodeType(right_ndx, warps, cns) !== 'ACN') console.error("RIGHT NDX of float NOT AN ACN", right_ndx);

        const right_pair_ndx = { i: modStrict(float.right.i + 1, wefts), j: modStrict(float.right.j, warps), id: 2 };
        if (getNodeType(right_pair_ndx, warps, cns) !== 'ACN') console.error("RIGHT PAIR NDX of float NOT AN ACN", right_pair_ndx);

        cns = setLayer(left_ndx, warps, cns, layer);
        cns = setLayer(right_ndx, warps, cns, layer);
        cns = setLayer(left_pair_ndx, warps, cns, layer);
        cns = setLayer(right_pair_ndx, warps, cns, layer);

        // for (let x = 0; x <= getWarpFloatLength(float, wefts); x++) {
        //     const adj_i = modStrict(float.left.i + x, wefts);
        //     //only set values that have no already been set by another layer
        //     if (getLayer({ i: adj_i, j: float.left.j, id: 0 }, warps, cns) == 0) {
        //         // cns = setLayer({ i: adj_i, j: float.left.j, id: 0 }, warps, cns, layer);
        //         // cns = setLayer({ i: adj_i, j: float.left.j, id: 1 }, warps, cns, layer);
        //         cns = setLayer({ i: adj_i, j: float.left.j, id: 2 }, warps, cns, layer);
        //         cns = setLayer({ i: adj_i, j: float.left.j, id: 3 }, warps, cns, layer);
        //     }
        // }
    } else if (float.face === false) {

        const left_ndx = { i: modStrict(float.left.i, wefts), j: modStrict(float.left.j, warps), id: 0 };
        if (getNodeType(left_ndx, warps, cns) !== 'ACN') console.error("LEFT NDX of float NOT AN ACN", left_ndx);

        const left_pair_ndx = { i: modStrict(float.left.i, wefts), j: modStrict(float.left.j - 1, warps), id: 1 };
        if (getNodeType(left_pair_ndx, warps, cns) !== 'ACN') console.error("LEFT PAIR NDX of float NOT AN ACN", left_pair_ndx);

        const right_ndx = { i: modStrict(float.right.i, wefts), j: modStrict(float.right.j, warps), id: 1 };
        if (getNodeType(right_ndx, warps, cns) !== 'ACN') console.error("RIGHT NDX of float NOT AN ACN", right_ndx);

        const right_pair_ndx = { i: modStrict(float.right.i, wefts), j: modStrict(float.right.j + 1, warps), id: 0 };
        if (getNodeType(right_pair_ndx, warps, cns) !== 'ACN') console.error("RIGHT PAIR NDX of float NOT AN ACN", right_pair_ndx);

        cns = setLayer(left_ndx, warps, cns, layer);
        cns = setLayer(right_ndx, warps, cns, layer);
        cns = setLayer(left_pair_ndx, warps, cns, layer);
        cns = setLayer(right_pair_ndx, warps, cns, layer);


        // for (let x = 0; x <= getWeftFloatLength(float, warps); x++) {
        //     const adj_j = modStrict(float.left.j + x, warps);
        //     if (getLayer({ i: float.left.i, j: adj_j, id: 0 }, warps, cns) == 0) {
        //         cns = setLayer({ i: float.left.i, j: adj_j, id: 0 }, warps, cns, layer);
        //         cns = setLayer({ i: float.left.i, j: adj_j, id: 1 }, warps, cns, layer);
        //         cns = setLayer({ i: float.left.i, j: adj_j, id: 2 }, warps, cns, layer);
        //         cns = setLayer({ i: float.left.i, j: adj_j, id: 3 }, warps, cns, layer);
        //     }
        // }

    }

    return cns;
}




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
export const getFloatRelationships = (i: number, float: CNFloat, wefts: number, warps: number, all_floats: Array<CNFloat>, cns: Array<ContactNeighborhood>): Array<{ kind: string, float: CNFloat | null }> => {


    //console.log("CHECKING FLOAT ID ", float.id, " ON ROW ", i, getWeftLayer(float.left.i, float.left.j, wefts, warps, cns))

    //wrap to continue search but eventually stop if we've covered the whole cloth
    let adj_i = i;
    //const float_layer = getWeftLayer(float.left.i, float.left.j, wefts, warps, cns);

    if (i < 0) adj_i = modStrict(i, wefts);

    //return if we've searched all rows
    if (modStrict(i, wefts) == float.left.i) return [];

    //get all of the attached floats on i
    const attached: Array<CNFloat> = getAttachedFloats(adj_i, float, warps, all_floats);
    const reltn: Array<{ kind: string, float: CNFloat | null }> = [];
    // console.log("ATTACHED ", attached.map(el => el.id));


    if (attached.length == 0) {

        const right_edge_ndx = { i: adj_i, j: float.right.j, id: 1 };
        const right_edge_type = getNodeType(right_edge_ndx, warps, cns);
        const left_edge_ndx = { i: adj_i, j: float.left.j, id: 0 };
        const left_edge_type = getNodeType(left_edge_ndx, warps, cns);
        let f_left: CNFloat | null = null;


        if (left_edge_type == "ACN" || right_edge_type == 'ACN') {

            //if there is an acn, it means it borders a weft float, so we need to get that float to the left or right. 
            if (left_edge_type == "ACN") {
                // x x x - - - x x x   if we peek at the float on the reference row, and teh edge is an ACN, we know it borders a blocking float
                // x x - x x x  x x x         


                f_left = getWeftFloat(left_edge_ndx.i, left_edge_ndx.j - 1, wefts, warps, all_floats);
                if (f_left !== null) reltn.push({ kind: "BUILD", float: f_left });
            }

            if (right_edge_type == "ACN") {
                const f_right = getWeftFloat(right_edge_ndx.i, right_edge_ndx.j + 1, wefts, warps, all_floats);
                if (f_right !== null) {
                    if (f_left == null) reltn.push({ kind: "BUILD", float: f_right });
                    else if (f_left.id !== f_right.id) reltn.push({ kind: "BUILD", float: f_right });
                }
            }

        } else {
            // x x x - - - x x x  an example float of this type, if we peek at the float on the reference row, there are no ACNS
            // x x x x x x  x x x 
            reltn.push({ kind: "SLIDE-OPP", float: null }); //sliding on the opposite side of the warp
        }

    } else {
        //determine what kind of relationship the 
        //check the edges of the float to see if they are crossing. 




        // reltn = reltn.concat(getWarpwiseRelationship(float, attached, warps));
    }
    return reltn;

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


export const getAllWeftFloats = (wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<CNFloat> => {

    let floats: Array<CNFloat> = [];

    for (let i = 0; i < wefts; i++) {
        const row = getRowAsFloats(i, warps, cns);
        floats = floats.concat(row);
    }

    return floats;

}


/**
 * goes through the floats of this draft and determines how they will eventually collide and stack. For single layer drafts, this works using only weft floats. 
 * for multilayer drafts it will work for all execpt the last layer, so we need to check the back side too. 
 * @param wefts 
 * @param warps 
 * @param cns 
 * @returns 
 */
export const setFloatBlocking = (wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<CNFloat> => {


    //gets all front and back facing floats
    const all_floats = getAllWeftFloats(wefts, warps, cns);
    all_floats.forEach((el, ndx) => {
        el.id = ndx;
    })

    // printFloats(all_floats.map(el => { return { id: el.id, float: el, touched: false } }));

    function hasBlockingRelationship(float: CNFloat, reltn: Array<{ kind: string, float: CNFloat | null }>) {
        // console.log('FLOAT ', float.id, " has relations ", reltn.map(el => el.kind), reltn.map(el => el.float?.id))
        if (reltn.find(el => el.kind == "BUILD") !== undefined) {
            reltn.forEach(el => {
                if (el.kind == "BUILD" && el.float !== null) {
                    if (float.blocking.find(fel => fel == el.float?.id) == undefined) float.blocking.push(el.float.id) //this needs to push the FLOAT that is blocking, not the row
                }
            })
            return true;
        } else {
            return false;
        }
    }


    for (let i = 0; i < wefts; i++) {

        const floats = all_floats.filter(el => el.left.i == i);

        floats.forEach(float => {

            //  console.log("FLOAT ", float.id, " FACE ", float.face);

            if (float.face != null) {
                let check_row = i - 1;
                let reltn = getFloatRelationships(check_row, float, wefts, warps, all_floats, cns);
                //console.log("RELTN ", reltn.map(el => el.kind), reltn.map(el => el.float?.id));
                while (hasBlockingRelationship(float, reltn) == false && modStrict(check_row, wefts) != float.left.i) {
                    check_row--;
                    reltn = getFloatRelationships(check_row, float, wefts, warps, all_floats, cns);

                }
            }
        });




    }
    return all_floats;

}



// /**
//  * updates the list of CNS by assigning each CN values based on it's relationship in the draft. 
//  * if a CN has been assigned a layer it is ignored  
//  * specifically, it looks at every neighbor (by edge) of the cell and sees if it is the same or a different value
//  * if the edge borders differing values, it becomes an ACN, if not, it remains a VCN
//  * A PCN borders an unset?
//  * @param cns 
//  * @param wefts 
//  * @param warps 
//  * @param sim 
//  * @returns 
//  */
export const updateCNs = (cns: Array<ContactNeighborhood>, wefts: number, warps: number, sim: SimulationVars): Array<ContactNeighborhood> => {

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
        console.log(printstring, f.float.blocking.map(el => el));
    }
}


//get the row as and back facing floats 
export const getFloats = (wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<CNFloat> => {
    //get weft floats; 
    let floats: Array<CNFloat> = [];

    for (let i = 0; i < wefts; i++) {
        floats = floats.concat(getRowAsFloats(i, warps, cns)).filter(float => !float.face);
    }

    for (let j = 0; j < warps; j++) {
        floats = floats.concat(getColAsFloats(j, wefts, warps, cns).filter(float => float.face));
    }

    //assign ids
    floats.forEach((el, ndx) => {
        el.id = ndx;
    })

    return floats;

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
export const isolateLayers = (wefts: number, warps: number, floats: Array<CNFloat>, layer: number, cns: Array<ContactNeighborhood>, sim: SimulationVars): Array<ContactNeighborhood> => {


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
    function liftFloat(float_ndx: number) {
        const float_obj = floats_with_id[float_ndx];

        if (float_obj.touched == true) return;

        float_obj.touched = true;

        let attached: Array<number> = [];

        //*IMPORTANT: we need to lift the floats by the limit * the layer + 1 because as we go down layers, the spacing between each warp is wider (because it includes warps on other layers and thus, needs to be adjusted)
        attached = getFloatsAffectedByLifting(float_ndx, floats_with_id, wefts, warps, (sim.lift_limit * layer));
        if (attached.length == 0) return;


        for (let a = 0; a < attached.length; a++) {
            const float_ndx = attached[a];
            if (float_ndx !== -1) liftFloat(float_ndx);
        }
    }


    //pull up on the longest warp float, see what moves with it. 
    liftFloat(longest_warp.id);


    //console.log("**** LIFTING COMPLETE ****")
    for (const f of floats_with_id) {
        if (f.touched) {
            cns = setFloatACNS(f.float, wefts, warps, layer, cns);
        }
    }

    // console.log("AFTER LAYER ", layer);
    // printLayerMap(cns, wefts, warps);
    return isolateLayers(wefts, warps, floats, ++layer, cns, sim)
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

    //printCNs(cns, wefts(d.drawdown), warps(d.drawdown));


    if (sim.wefts_as_written) {
        cns = pullRows(d, paths, cns);
        //update CNS after pull to reset warp aligned ACNS
        cns = updateCNs(cns, wefts(d.drawdown), warps(d.drawdown), sim);

    }

    //gets all the weft floats
    const floats = getFloats(wefts(dd), warps(dd), cns);
    cns = isolateLayers(wefts(dd), warps(dd), floats, 1, cns, sim);


    printCNs(cns, wefts(dd), warps(dd));
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
const getFellY = (vtxs: Array<YarnVertex>): number => {
    const max_y = vtxs.reduce((acc, el) => {
        if (el.vtx.y > acc) return el.vtx.y;
        return acc;
    }, 0);
    return max_y;

}

/**
 * center the x on the warp
 * @param vtx 
 * @param j 
 * @param d 
 * @returns 
 */

export const calcX = (vtx: Vec3, j: number, d: number): Vec3 => {
    vtx.x = j * d;
    return vtx;
};

/**
 * computes the distance the beat will push the yarn based on the strength of the beat.
 * @param beat_strength - the strength of the beat (0-1)
 * @returns the distance the beat will push the yarn
 */
export const getBeatDistance = (beat_strength: number): number => {
    if (beat_strength > 1 || beat_strength < 0) console.error("BEAT STRENGTH IS OUT OF BOUNDS ", beat_strength);
    if (beat_strength < 0) beat_strength = 0;
    if (beat_strength > 1) beat_strength = 1;
    return interpolate(beat_strength, { min: 0, max: 300 });
}


/**
 * 
 * @param warps 
 * @param wefts 
 * @param blocking_floats 
 * @param vtx_list 
 * @returns 
 */
export const hasBlockingVtx = (warps: number, wefts: number, blocking_floats: Array<CNFloat>, vtx_list: Array<YarnVertex>): boolean => {

    if (blocking_floats.length == 0) return false;
    const has_blocking_vtx = blocking_floats.every(el => {
        const vtx_left = vtx_list.find(v => v.ndx.i == modStrict(el.left.i, wefts) && v.ndx.j == modStrict(el.left.j, warps));
        const vtx_right = vtx_list.find(v => v.ndx.i == modStrict(el.right.i, wefts) && v.ndx.j == modStrict(el.right.j, warps));
        return vtx_left !== undefined && vtx_right !== undefined;
    });
    return has_blocking_vtx;
}

export const getMaterialFromPath = (i: number, paths: Array<WeftPath>, sim: SimulationVars): Material | null => {
    const path = paths.find(el => el.pics.includes(i));
    if (path == undefined) {
        return null;
    }
    return sim.ms.find(el => el.id == path.material) ?? null;
}


export const getYarnHeightOffset = (blocking_i: number, paths: Array<WeftPath>, sim: SimulationVars): number => {



    const blocking_mat = getMaterialFromPath(blocking_i, paths, sim);
    if (blocking_mat == null) {
        return 0;
    }

    return (blocking_mat.diameter / 2);
}



/**
 * finds the left edge of this float in the vertex list. Checks to make sure that the vertex is in range and that the vertex that matches is not a virtual vertex. 
 * @param float 
 * @param warps 
 * @param wefts 
 * @param vtx_list 
 * @returns 
 */
export const getFloatVtxLeft = (float: CNFloat, warps: number, wefts: number, vtx_list: Array<YarnVertex>): YarnVertex | null => {

    let j = float.left.j;
    const i = float.left.i;
    if (j < 0 || j >= warps) j = modStrict(j, warps);
    if (i < 0 || i >= wefts) return null;

    const vtxs = vtx_list.filter(v => v.ndx.i == i && v.ndx.j == j && v.ndx.id == float.left.id);
    if (vtxs.length == 0) return null;
    if (vtxs.length > 1) {
        console.error("MORE THAN ONE VTX FOUND FOR FLOAT LEFT ", i, j);
        return null;
    }
    return vtxs[0];
}


/**
 * finds the left edge of this float in the vertex list. Checks to make sure that the vertex is in range and that the vertex that matches is not a virtual vertex. 
 * @param float 
 * @param warps 
 * @param wefts 
 * @param vtx_list 
 * @returns 
 */
export const getFloatVtxRight = (float: CNFloat, warps: number, wefts: number, vtx_list: Array<YarnVertex>): YarnVertex | null => {


    let j = float.right.j;
    const i = float.right.i;
    if (j < 0 || j >= warps) j = modStrict(j, warps);
    if (i < 0 || i >= wefts) return null;

    const vtxs = vtx_list.filter(v => v.ndx.i == i && v.ndx.j == j && v.ndx.id == float.right.id);
    if (vtxs.length == 0) return null;
    if (vtxs.length > 1) {
        console.error("MORE THAN ONE VTX FOUND FOR FLOAT RIGHT ", i, j);
        return null;
    }
    return vtxs[0];
}


export const getBlockingVtx = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>, vtx_list: Array<YarnVertex>): YarnVertex | null => {
    const cn = getCN(ndx, warps, cns);
    const blocking_vtx = cn.isect !== null ? getVertexForCN(cn.isect, vtx_list) : null;

    return blocking_vtx;
}

/**
 * computes the y value of the highest vertex of the blocking floats.
 * it is possible for the blocking float to not have been added yet, for instance, if the float is wrapping. In that case, this function returns 
 * @param warps 
 * @param wefts 
 * @param blocking_floats 
 * @param vtx_list 
 * @returns 
 */
export const getYOfBlockingVtx = (blocking_vtx: YarnVertex | null, paths: Array<WeftPath>, sim: SimulationVars, verbose: boolean): number => {


    let blocking_y: number = 0; //the y value of the highest vertex of the blocking floats. 

    if (blocking_vtx === null) return 0;

    blocking_y = blocking_vtx.vtx.y;
    if (verbose) console.log("BLOCKING Y ", blocking_y)
    const height_offset = getYarnHeightOffset(blocking_vtx.ndx.i, paths, sim);
    return blocking_y + height_offset;

}


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
export const getRepelForceAtVtx = (vtx: Vec3, blocking_vtx: YarnVertex | null, verbose: boolean): number => {

    if (blocking_vtx === null) return -1;

    let r = Math.sqrt(Math.pow(vtx.x - blocking_vtx.vtx.x, 2) + Math.pow(vtx.y - blocking_vtx.vtx.y, 2));
    if (r == -1) return -1;
    if (r == 0) r = .8

    if (verbose) console.log("DISTANCE ACN ", r)
    const r_meters = r / 1000;

    const k = 8.99 * Math.pow(10, 9);
    const q1 = .0000003;
    const q2 = .0000003;

    return k * Math.abs(q1 * q2) / Math.pow(r_meters, 2);

}


/**
 * calculates the distance the vertex will be pushed by the force of the closest ACN.
 * @param force_repel 
 * @returns 
 */
export const calculateYRepel = (force_repel: number, time: number, mass: number, verbose: boolean): number => {
    if (verbose) console.log("FORCE REPEL ", force_repel, time)
    const a = force_repel / mass; //accelleration is F/mass
    const distance = .5 * Math.pow(a * time, 2);
    return distance
}


// export const getLeftNeighboringFloat = (warps: number, float: CNFloat, all_floats: Array<CNFloat>): CNFloat | null => {
//     const float_left_j = modStrict(float.left.j - 1, warps);
//     const left_float = all_floats.filter(el => el.right.i == float.left.i && modStrict(el.right.j, warps) == float_left_j && el.right.id == 1);
//     if (left_float.length == 0) return null;
//     return left_float[0];
// }


// export const getRightNeighboringFloat = (warps: number, float: CNFloat, all_floats: Array<CNFloat>): CNFloat | null => {
//     const float_right_j = modStrict(float.right.j + 1, warps);
//     const right_float = all_floats.filter(el => el.left.i == float.right.i && modStrict(el.left.j, warps) == float_right_j && el.left.id == 0);
//     if (right_float.length == 0) return null;
//     return right_float[0];
// }


export const getBlockingFloatsForACN = (warps: number, float: CNFloat, all_floats: Array<CNFloat>): Array<CNFloat> => {
    const blocking_list = float.blocking.filter(el => all_floats.find(f => f.id == el) !== undefined).map(el => all_floats.find(f => f.id == el) as CNFloat);
    return blocking_list;
}

export const getVertexForCN = (ndx: CNIndex, vtx_list: Array<YarnVertex>): YarnVertex | null => {
    // console.log("vertex list length ", vtx_list);
    const vtx = vtx_list.find(el => el.ndx.i == ndx.i && el.ndx.j == ndx.j);
    if (vtx !== undefined) {
        return vtx;
    }
    return null;
}

/**
 * when calculating y on a weft, we need to see where the weft collides with other wefts. Since verticies are only created on weft floats this function also checks the floats to the left and right to see what they block with.
 * @param float 
 * @param all_floats 
 * @param cns 
 */
// export const getRelevantBlockingFloatsForACN = (warps: number, float: CNFloat, all_floats: Array<CNFloat>, verbose: boolean): Array<CNFloat> => {

//     const blocking_list = float.blocking.filter(el => all_floats.find(f => f.id == el) !== undefined).map(el => all_floats.find(f => f.id == el) as CNFloat);

//     const left = getLeftNeighboringFloat(warps, float, all_floats);

//     if (left !== null) {
//         const left_float_blocking = left.blocking.filter(el => all_floats.find(f => f.id == el) !== undefined).map(el => all_floats.find(f => f.id == el) as CNFloat);
//         left_float_blocking.forEach(el => {
//             if (blocking_list.find(f => f.id == el.id) == undefined) {
//                 blocking_list.push(el);
//             }
//         });
//     }


//     const right = getRightNeighboringFloat(warps, float, all_floats);
//     if (right !== null) {
//         const right_float_blocking = right.blocking.filter(el => all_floats.find(f => f.id == el) !== undefined).map(el => all_floats.find(f => f.id == el) as CNFloat);
//         right_float_blocking.forEach(el => {
//             if (blocking_list.find(f => f.id == el.id) == undefined) {
//                 blocking_list.push(el);
//             }
//         });
//     }
//     if (verbose) console.log("LEFT AND RIGHT CHECK ", left, right)
//     return blocking_list;
// }

// y is a function of: 
//  *      i - the position in which the yarn is inserted
//  *      b - the strength of the beat (0, 1)
//  *      p - the proximity of this vertex to the crossing of it's float with another float the closer the cross to this point, the more it will "repel" the previous warp (which is, itself, a function of warp density)
//  *      max_dist the farthest this weft and be away from the fell. (x, float, all floats)
// This function calculates the position of y as though multiple actions have been taken. 
// 1. The weft is inserted at a position y insert that is 200px above all other y values 
// 2. The beat pushes the y it max pressure, all vertexes are pushed as far as they will go. 
// 3. After the beat is released the vertexes are repelled by their proximity to the closest ACN on any of the blocking wefts.  
// 4. After all the of these values are added, a smoothing step needs to take place to lift up any vertexes based on the stretchiness of the yarn. 

export const calcY = (ndx: CNIndex, vtx: Vec3, b: number, warps: number, wefts: number, vtx_list: Array<YarnVertex>, paths: Array<WeftPath>, sim: SimulationVars, cns: Array<ContactNeighborhood>, verbose: boolean = false): Vec3 => {



    //INSERT - assume this is 200 px above the highest vtx. 

    if (verbose) console.log("INSERT Y ", vtx.y)

    //BEAT - assume 300 gets us as far as we need to go. 
    const y_beat = vtx.y - (30 * b);
    if (verbose) console.log("Y _ BEAT ", y_beat)

    const blocking_vtx = getBlockingVtx(ndx, warps, cns, vtx_list);
    if (verbose) console.log("BLOCKING VTX ", blocking_vtx)
    const y_blocking = getYOfBlockingVtx(blocking_vtx, paths, sim, verbose);
    if (verbose) console.log("Y BLOCKING ", y_blocking)


    vtx.y = Math.max(y_blocking, y_beat);


    const force_repel = getRepelForceAtVtx(vtx, blocking_vtx, verbose);
    if (force_repel == -1) {
        vtx.y = Math.max(getYarnHeightOffset(0, paths, sim), y_beat);
    } else {
        if (verbose) console.log("REPEAL FORCE", force_repel)

        const y_repel = calculateYRepel(force_repel, sim.time, sim.mass, verbose);
        if (verbose) console.log("REPEAL DIST", y_repel)

        vtx.y += y_repel;
    }

    if (verbose) console.log("RETURNING ", vtx.y)

    return vtx;


}

/**
 * computes the maximum theta for a given stretch value.
 * a very stretchy yarn (stretch = 1) would have a theta_max of PI/2 degrees. a less stretchy yarn might not be move much, so lets say PI / 24 so theta max is an interpolation between PI/4 and PI/24 
 * @param stretch 
 * @returns 
 */
export const computeThetaMax = (stretch: number): number => {
    if (stretch > 1 || stretch < 0) console.error("STRETCH IS OUT OF BOUNDS ", stretch);
    return interpolate(stretch, { min: Math.PI / 24, max: Math.PI / 4 });
}


/**
 * computes the angle between two vertices.
 * @param vtx1 (the last observed vertex - always computes left to right, so this is the leftmost vertex)
 * @param vtx2 (the current vertex - always computes left to right, so this is the rightmost vertex)
 * @returns the theta between the two verticies. -theta means the last vertex is highter (has a higheter y value than the current). +theta means the opposite
 */
export const computeThetaBetweenVertices = (vtx1: YarnVertex, vtx2: YarnVertex): number => {
    const x_diff = vtx2.vtx.x - vtx1.vtx.x;
    const y_diff = vtx2.vtx.y - vtx1.vtx.y;
    return Math.atan(y_diff / x_diff);
}

/**
 * computes the y adjustment needed to move a vertex up to the theta_max.
 * @param vtx1 
 * @param vtx2 
 * @param theta_max 
 * @returns 
 */
export const computeYAdjustment = (vtx1: YarnVertex, vtx2: YarnVertex, theta_max: number): number => {
    const x_diff = vtx2.vtx.x - vtx1.vtx.x;
    return Math.tan(theta_max) * x_diff;
}


/**
 * TODO decide if we need to compute a global max first. This only compares pairwise. 
 * scans through all the vertexes of a pick from left ot right and adjusts the angle between vertexes such that the yarn can only travel so far between the highest vertex
 * this function accounts for the fact that the beat will only push the yarn so far, it cannot keep pushing after a certain point. Therefefore, smooth yarns pulls up any vertexes that are too far below their  highest neighbor
 * @param pick 
 * @param stretch 
 * @returns the pick with adjusted y values
 */
export const smoothPick = (pick: Array<YarnVertex>, stretch: number, theta_max: number, spacing: number): Array<YarnVertex> => {

    // const theta_max = computeThetaMax(stretch);

    const max_y = pick.reduce((max, el) => Math.max(max, el.vtx.y), 0);
    const min_y = max_y - (Math.tan(theta_max) * spacing);

    pick.forEach(el => {
        if (el.vtx.y < min_y) {
            el.vtx.y = min_y;
        }
    });

    return pick;

}



/**
 * given the x position of an ACN, this function returns the closest ACN on a blocking float for this ACN. It returns only the X distance of the closest ACN. 
 * a value of 0 means the acns are directly above one another, and should stack. A value close to one, is a strong repel. 
 * a larger value means that the ACNs are separated by some other distance. 
 * At a later date, we make this consider x and y, in the case when the y values between vary. 
 * @returns the distance between the ACNS as it would be rendered in pixels
 */
export const getClosestBlockingVertex = (ndx: CNIndex, vtx: Vec3, warps: number, wefts: number, vtx_list: Array<YarnVertex>, cns: Array<ContactNeighborhood>, verbose: boolean): number => {



    if (vtx_list.length == 0) return -1;

    const weft_layer = getWeftLayer(ndx, warps, cns);

    //get eligable blocking vertices that have already been added to the vtx list
    //CONSIDER IF WE NEED TO CAP THIS TO SOME AMOUNT SO THAT IT DOESN"T EXPLODE WITH NEEDLESS VALUES
    const eligable_blocking_vtxs = vtx_list.filter(el => getLayer(el.ndx, warps, cns) == weft_layer);

    if (eligable_blocking_vtxs.length == 0) return -1;

    let min_dist = 10000;
    eligable_blocking_vtxs.forEach(el => {


        //initialize the distances to a large number
        let dist_square: number = 100000;
        dist_square = Math.pow(vtx.x - el.vtx.x, 2) + Math.pow(vtx.y - el.vtx.y, 2);

        if (dist_square < min_dist) min_dist = dist_square;


        //if (verbose) console.log("MIN DIST ", min_dist)
    });

    return Math.sqrt(min_dist);

}






// }


/**
 * z points sit at the edges of the warp so the face doesn't affect the position, instead, they use control points to control the shape.
 * @param layer 
 * @param layer_spacing 
 * @returns 
 */
export const calcZ = (pos: Vec3, face: boolean | null, layer: number, layer_spacing: number, warp_diameter: number, weft_diameter: number): Vec3 => {
    if (face == null) console.error("FACE IS NULL in calcZ");
    const offset = warp_diameter / 2 + weft_diameter / 2;
    pos.z = layer * -layer_spacing;
    pos.z = (face) ? pos.z - offset : pos.z + offset;
    return pos;
}


/**
 * used to create a vertex that simulates full width
 * @param ndx 
 * @param fell 
 * @param d 
 * @param vtx_list 
 * @param cns 
 * @param all_floats 
 * @param sim 
 * @returns 
 */
const createPlaceholderVertex = (ndx: CNIndex, y: number, z: number, d: Draft, sim: SimulationVars): YarnVertex => {

    let pos: Vec3 = { x: 0, y: y, z: z };
    pos = calcX(pos, ndx.j, sim.warp_spacing);
    return { ndx, vtx: pos, orientation: null }


}


/**
 * z is a function of: 
 *      l - the layer number associated with this ACN. 
 *      f - the face (or size) of the warp it sits upon. 
 *      diam - the warp and weft diameter
 *  
/**
 * creates a vertex for the simulation
 * the (0,0) axis represents teh bottom left corner of the weave (such that +y moves up the fabric from bottom to top)
 * -z is moving from the face moving towards the back of the fabric, +z is moving towars  
 * 1 px = 1 mm
 */
const createWeftVertex = (ndx: CNIndex, fell: number, d: Draft, vtx_list: Array<YarnVertex>, cns: Array<ContactNeighborhood>, paths: Array<WeftPath>, sim: SimulationVars): YarnVertex => {

    //const verbose = ndx.i == 2;
    const verbose = false;
    if (verbose) console.log("CREATING FOR ", ndx)

    const pack_offset = 20; //a value in mm to offset the pack of the fabric from the edge of the fabric. 
    const weft_material_id = d.rowShuttleMapping[ndx.i];
    const weft_diameter = getDiameter(weft_material_id, sim.ms);
    const warp_material_id = d.colShuttleMapping[ndx.j];
    const warp_diameter = getDiameter(warp_material_id, sim.ms);
    const face = getFace(ndx, warps(d.drawdown), cns);
    const edge = (ndx.id == 0) ? true : false; //left or right

    //orientation is face xor edge
    const orientation = face !== edge;
    let pos: Vec3 = { x: 0, y: fell + pack_offset, z: 0 };

    pos = calcX(pos, ndx.j, sim.warp_spacing);
    pos = calcY(ndx, pos, sim.pack, warps(d.drawdown), wefts(d.drawdown), vtx_list, paths, sim, cns, verbose);
    pos = calcZ(pos, face, getLayer(ndx, warps(d.drawdown), cns), sim.layer_spacing, warp_diameter, weft_diameter);


    if (verbose) console.log("CREATED VTX ", ndx, pos)
    return { ndx, vtx: pos, orientation }


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



// export const createWarpVertex = (ndx: CNIndex, wefts: number, warps: number, weft_paths: Array<WeftPath>, orientation: boolean, sim: SimulationVars, cns: Array<ContactNeighborhood>, all_floats: Array<CNFloat>): YarnVertex | null => {
//     const layer = getLayer(ndx, warps, cns);

//     //to get the y position, we need to find the already created y closest to to this point
//     const weft_float = getWeftFloat(ndx.i, ndx.j, wefts, warps, all_floats);
//     const flat_vtx_list = getFlatVtxList(weft_paths);
//     if (weft_float == null) {
//         console.error("no weft float found for ndx ", ndx);
//         return null;
//     }

//     if (weft_float.face == false) {
//         const vtx_left = flat_vtx_list.find(el => el.ndx.i == weft_float.left.i && el.ndx.j == weft_float.left.j && el.ndx.id == weft_float.left.id);

//     }else{

//     }




//     const vtx: Vec3 = { x: ndx.j * sim.warp_spacing, y: ndx.i * sim.warp_spacing, z: calcZ(layer, sim.layer_spacing) };
// }

// export const createWarpPath = (wefts: number, warps: number, min_y: number, max_y: number, weft_paths: Array<WeftPath>, j: number, cns: Array<ContactNeighborhood>, sim: SimulationVars): Array<YarnVertex> => {


//     const warp_floats = getColAsFloats(j, wefts, warps, cns).filter(el => el.face == true);

//     warp_floats.forEach(el => {
//         const vtx = createWarpVertex(el.left, true, 0, draft, flat_vtx_list, cns, floats, paths, sim);
//     });
// }

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
export const createWarpPathFromWeftPaths = (wefts: number, min_y: number, max_y: number, weft_paths: Array<WeftPath>, j: number, sim: SimulationVars): Array<YarnVertex> => {

    const warp_path: Array<YarnVertex> = [];

    const x = j * sim.warp_spacing;
    const z = 1 * -sim.layer_spacing;
    // for (let i = 0; i < wefts; i++) {
    //     const path = weft_paths.find(el => el.pics.includes(i));
    //     if (path !== undefined) {
    //         const j_vals = path.vtxs.filter(el => el.ndx.j == j);
    //         if (j_vals.length > 0) {
    //             const j_val = j_vals[0]; //make sure we only push 1 vtx
    //             const vtx: Vec3 = { x: x, y: j_val.vtx.y, z: j_val.vtx.z };
    //             const yarn_vtx: YarnVertex = { ndx: { i: i, j: j, id: 2 }, vtx: vtx, orientation: null };
    //             warp_path.push(yarn_vtx);
    //         }
    //     } else {
    //         console.error("path not found for i ", i);
    //     }
    // }



    const starting_vtx: YarnVertex = { ndx: { i: -1, j: j, id: 2 }, vtx: { x: x, y: min_y - 10, z: z }, orientation: null };
    if (warp_path.length > 0) starting_vtx.vtx.z = warp_path[0].vtx.z;
    warp_path.unshift(starting_vtx);

    const ending_vtx: YarnVertex = { ndx: { i: wefts, j: j, id: 2 }, vtx: { x: x, y: max_y + 10, z: z }, orientation: null };
    if (warp_path.length > 0) ending_vtx.vtx.z = warp_path[warp_path.length - 1].vtx.z;
    warp_path.push(ending_vtx);


    return warp_path;
}

export const getMinY = (weft_paths: Array<WeftPath>): number => {
    return weft_paths.reduce((acc, el) => {
        return Math.min(acc, el.vtxs.reduce((acc, el) => {
            return Math.min(acc, el.vtx.y);
        }, 1000000));
    }, 1000000);
}

export const getMaxY = (weft_paths: Array<WeftPath>): number => {
    return weft_paths.reduce((acc, el) => {
        return Math.max(acc, el.vtxs.reduce((acc, el) => {
            return Math.max(acc, el.vtx.y);
        }, 0));
    }, 0);
}

/**
 * generates a yarn path for each warp and returns a collection of warps for drawing. 
 * @param draft 
 * @param topo 
 * @param wefts 
 * @param sim 
 * @returns 
 */
export const placeWarps = (draft: Draft, weft_paths: Array<WeftPath>, sim: SimulationVars): Promise<Array<WarpPath>> => {

    const warp_paths: Array<WarpPath> = [];
    const min_y = getMinY(weft_paths);
    const max_y = getMaxY(weft_paths);

    for (let j = 0; j < warps(draft.drawdown); j++) {
        const system = draft.colSystemMapping[j];
        const material = draft.colShuttleMapping[j];
        const path: Array<YarnVertex> = createWarpPathFromWeftPaths(wefts(draft.drawdown), min_y, max_y, weft_paths, j, sim);

        if (path === undefined || path === null) {
            return Promise.reject("warp path with system and material not found");
        } else {
            warp_paths.push({ system, material, vtxs: path });
        }
    }

    return Promise.resolve(warp_paths);
}

export const addPlaceholderVertices = (temp_pic: Array<YarnVertex>, i: number, direction: boolean, warpnum: number, cns: Array<ContactNeighborhood>, draft: Draft, sim: SimulationVars): Array<YarnVertex> => {
    let start_vtx: YarnVertex | null = null;
    let end_vtx: YarnVertex | null = null;
    const last_ndx = temp_pic.length - 1;

    if (temp_pic.length > 0) {

        const start_ndx = (direction) ? 0 : warpnum - 1;
        const end_ndx = (direction) ? warpnum - 1 : 0;


        if (temp_pic.findIndex(el => el.ndx.j == start_ndx) == -1) {
            start_vtx = createPlaceholderVertex({ i: i, j: start_ndx, id: 0 }, temp_pic[0].vtx.y, temp_pic[0].vtx.z, draft, sim);
        }

        //set it to the layer for this weft
        if (temp_pic.findIndex(el => el.ndx.j == end_ndx) == -1) {
            end_vtx = createPlaceholderVertex({ i: i, j: end_ndx, id: 1 }, temp_pic[last_ndx].vtx.y, temp_pic[last_ndx].vtx.z, draft, sim);
        }
    }

    if (start_vtx !== null) temp_pic.unshift(start_vtx);
    if (end_vtx !== null) temp_pic.push(end_vtx);

    return temp_pic;
}



/**
 * this gets the orientation between two vertexes based on the face values. 
 * If two consecutive cells go from false (heddle down)=> true (heddle up) then the weft is moving from the front face to the back face (false) 
* @param el 
 * @param el2 
 * @param warps 
 * @param cns 
 * @returns 
 */
export const getOrientation = (el: YarnVertex, el2: YarnVertex, warps: number, cns: Array<ContactNeighborhood>): boolean | null => {


    if (el.ndx.j != el2.ndx.j - 1) {
        console.error("orientation cannot be determined between non-consecutive vertexes");
        return null;
    }

    const el_ndx = el.ndx;
    const el2_ndx = el2.ndx;

    const el_type = getFace(el_ndx, warps, cns);
    const el2_type = getFace(el2_ndx, warps, cns);

    if (setAndOppositeFaces(el_type, el2_type)) return el_type; //return what the first vtx is. 
    else {
        console.error("Paired vertexes are not opposite faces   ");
        return null;
    }



}



/**
* between each front/back facing weft float pair, there should be at least one blocking float. Update the pair based 
* on the max y value (set from the blocking float). Also reposition the ACN x value in the center of the warp spacing, instead of at the edge the warp. 
 * @param temp_pic 
 * @returns 
 */
export const pruneDuplicateVertices = (temp_pic: Array<YarnVertex>): Array<YarnVertex> => {


    return temp_pic.reduce((acc: Array<YarnVertex>, el: YarnVertex) => {

        const has_index = acc.findIndex(accel => accel.ndx.j == el.ndx.j);
        if (has_index == -1) {
            acc.push(el);
        }
        return acc;
    }, []);

}


/**
 * because each float produces two verticies, they are redundant. remove one but update y such that the one that is kept 
 * is the tallest of the two (to account for warp-face weft float blocking)
 * @param temp_pic 
 * @returns 
 */
export const reduceVerticesAndSetOrientation = (paths: Array<WeftPath>, warps: number, cns: Array<ContactNeighborhood>, sim: SimulationVars): Array<WeftPath> => {

    paths.forEach(path => {
        //get all the right edges and right edges
        const right_edges = path.vtxs.filter(el => el.ndx.id == 1);

        //for each left edge, see if it has a right edge on the next warp
        right_edges.forEach(el => {
            const next_warp = el.ndx.j + 1;
            const next_left_edge_id = path.vtxs.findIndex(tel => tel.ndx.i == el.ndx.i && tel.ndx.j == next_warp && tel.ndx.id == 0);

            if (next_left_edge_id !== -1) {
                const next_left_edge = path.vtxs[next_left_edge_id];
                const orientation = getOrientation(el, next_left_edge, warps, cns);
                if (orientation !== null) {
                    el.orientation = orientation;
                }

                //remove the next left edge from the vertex list
                path.vtxs = path.vtxs.filter((tel, index) => index !== next_left_edge_id);
            }


        });
    });



    return paths;

}


export const getWeftLayer = (ndx: CNIndex, warps: number, cns: Array<ContactNeighborhood>): number => {

    //walk left until you hit an ACN - then return it's layer. 
    let found = false;
    let layer_left = 0, layer_right = 0;
    for (let j_offset = 0; j_offset < warps - 1 && !found; j_offset++) {
        const j_adj = modStrict(ndx.j - j_offset, warps);
        const cn_left = getCN({ i: ndx.i, j: j_adj, id: 0 }, warps, cns);
        if (cn_left.node_type == 'ACN') {
            found = true;
            layer_left = cn_left.layer;
        }
    }

    found = false;
    for (let j_offset = 0; j_offset < warps - 1 && !found; j_offset++) {
        const j_adj = modStrict(ndx.j + j_offset, warps);
        const cn_right = getCN({ i: ndx.i, j: j_adj, id: 1 }, warps, cns);
        if (cn_right.node_type == 'ACN') {
            found = true;
            layer_right = cn_right.layer;
        }
    }

    if (layer_left !== layer_right) {
        console.error("WEFT LAYER MISMATCH", ndx, layer_left, layer_right);
    }

    return layer_left;
}

export const getWarpLayer = (ndx: CNIndex, wefts: number, warps: number, cns: Array<ContactNeighborhood>): number => {
    //walk up until you hit an ACN - then return it's layer. 
    let found = false;
    let layer_left = 0, layer_right = 0;
    for (let i_offset = 0; i_offset < wefts - 1 && !found; i_offset++) {
        const i_adj = modStrict(ndx.i - i_offset, wefts);
        const cn_left = getCN({ i: i_adj, j: ndx.j, id: 2 }, warps, cns);
        if (cn_left.node_type == 'ACN') {
            found = true;
            layer_left = cn_left.layer;
        }
    }

    found = false;
    for (let i_offset = 0; i_offset < wefts - 1 && !found; i_offset++) {
        const i_adj = modStrict(ndx.i + i_offset, wefts);
        const cn_right = getCN({ i: i_adj, j: ndx.j, id: 3 }, warps, cns);
        if (cn_right.node_type == 'ACN') {
            found = true;
            layer_right = cn_right.layer;
        }
    }

    if (layer_left !== layer_right) {
        console.error("WARP LAYER MISMATCH", ndx, layer_left, layer_right);
    }

    return layer_left;
}


export const pruneAndSetCNBlocking = (wefts: number, warps: number, cns: Array<ContactNeighborhood>): Array<ContactNeighborhood> => {
    const acns = cns
        .filter(el => el.node_type == 'ACN')
        .filter(el => el.ndx.id < 2)
        .filter(el => getWeftLayer(el.ndx, warps, cns) == getWarpLayer(el.ndx, wefts, warps, cns));



    acns.forEach(acn => {
        const layer = getWeftLayer(acn.ndx, warps, cns);
        let potential_blocks = acns.filter(el => getWeftLayer(el.ndx, warps, cns) == layer && el.ndx.i < acn.ndx.i && el.ndx.id < 2);

        //prune this list so it is just the max i
        const max_i = potential_blocks.reduce((acc: number, el: ContactNeighborhood) => {
            return Math.max(acc, el.ndx.i);
        }, 0);
        potential_blocks = potential_blocks.filter(el => el.ndx.i == max_i);

        //get the j value that is the closest to this vertex. 
        const closest_j = potential_blocks.reduce((acc: number, el: ContactNeighborhood) => {
            return Math.min(acc, Math.abs(el.ndx.j - acn.ndx.j));
        }, 1000);
        potential_blocks = potential_blocks.filter(el => Math.abs(el.ndx.j - acn.ndx.j) == closest_j);




        if (potential_blocks.length > 0) {
            acn.isect = potential_blocks[0].ndx
        }
    });

    return acns;

}

export const followTheWefts = (draft: Draft, cns: Array<ContactNeighborhood>, sim: SimulationVars): Promise<Array<WeftPath>> => {
    // printDrawdown(draft.drawdown);
    // printCNs(cns, wefts(draft.drawdown), warps(draft.drawdown));


    const pruned_cns = pruneAndSetCNBlocking(wefts(draft.drawdown), warps(draft.drawdown), cns);
    // console.log("PRUNED CNS ", pruned_cns.map(el => el.isect));

    const warpnum = warps(draft.drawdown);

    //get a list of the unique system-material combinations of this weft. 
    const paths: Array<WeftPath> = initWeftPaths(draft);
    let fell_y = 0;

    //parse row by row, then assign to the specific path to which this belongs
    for (let i = 0; i < wefts(draft.drawdown); i++) {

        //console.log("FOLLOWING WEFT ", i);

        const system = draft.rowSystemMapping[i];
        const material = draft.rowShuttleMapping[i];
        const path = getWeftPath(paths, system, material);

        if (path === undefined || path === null) {
            return Promise.reject("weft path with system and material not found");
        }

        const flat_vtx_list = getFlatVtxList(paths);
        const direction = (path.pics.length % 2 == 0);  //true is left to right, false is 
        let temp_pic: Array<YarnVertex> = [];

        let pic_acns = pruned_cns.filter(el => el.ndx.i == i && el.ndx.id < 2);
        if (!direction) pic_acns = pic_acns.reverse();

        // console.log("PIC ACNS ", pic_acns.map(el => el.ndx));
        pic_acns.forEach(el => {
            const vtx = createWeftVertex(el.ndx, fell_y, draft, flat_vtx_list, cns, paths, sim);
            temp_pic.push(vtx);
        });

        //  console.log("TEMP BEFORE ", temp_pic.map(el => el.ndx));

        //updates the x and y values based on blocking of both front and back facing weft floats
        temp_pic = pruneDuplicateVertices(temp_pic);
        //  console.log("AFTER PRUNING ", temp_pic.map(el => el.ndx));

        //  console.log("AFTER ALIGNMET ", i, temp_pic.map(el => el.vtx.y));

        //given a particular theta, smooth the pick. Make sure the yarn cannot move more than theta away from the highest vertex. 
        if (sim.use_smoothing) {
            temp_pic = smoothPick(temp_pic, getMaterialStretch(sim.ms[material]), sim.max_theta, sim.warp_spacing);
        }
        //  console.log("AFTER SMOOTHING ", i, temp_pic.map(el => el.vtx.y));


        //if we are rending full width add placeholder verticies and make sure they match the layer of the weft. 
        if (!sim.wefts_as_written)
            temp_pic = addPlaceholderVertices(temp_pic, i, direction, warpnum, cns, draft, sim);
        //   console.log("AFTER PLACEHOLDER ", i, temp_pic.map(el => el.vtx.y));




        path.vtxs = path.vtxs.concat(temp_pic);
        path.pics.push(i);
        fell_y = getFellY(flat_vtx_list.concat(path.vtxs));
    }


    return Promise.resolve(paths);


}




/**
 * this function walks the ACNS pick by pick. It creates a vertex anywhere it finds a weft-float ACN. It also assigns that vertex to the 
 * correct weft path. 
 * @param draft 
 * @param floats 
 * @param cns 
 * @param sim 
 * @returns 
 */
// export const followTheWefts = (draft: Draft, floats: Array<CNFloat>, cns: Array<ContactNeighborhood>, sim: SimulationVars): Promise<Array<WeftPath>> => {
//     const warpnum = warps(draft.drawdown);

//     //get a list of the unique system-material combinations of this weft. 
//     let paths: Array<WeftPath> = initWeftPaths(draft);
//     let fell_y = 0;

//     //parse row by row, then assign to the specific path to which this belongs
//     for (let i = 0; i < wefts(draft.drawdown); i++) {

//         //console.log("FOLLOWING WEFT ", i);

//         const system = draft.rowSystemMapping[i];
//         const material = draft.rowShuttleMapping[i];
//         const path = getWeftPath(paths, system, material);

//         if (path === undefined || path === null) {
//             return Promise.reject("weft path with system and material not found");
//         }

//         const flat_vtx_list = getFlatVtxList(paths);
//         const direction = (path.pics.length % 2 == 0);  //true is left to right, false is 
//         let temp_pic: Array<YarnVertex> = [];


//         if (direction) {
//             for (let j = 0; j < warpnum; j++) {

//                 const ndx_left = { i, j, id: 0 };
//                 const ndx_right = { i, j, id: 1 };

//                 if (getNodeType(ndx_left, warpnum, cns) == 'ACN') {
//                     const vtx = createWeftVertex(ndx_left, fell_y, draft, flat_vtx_list, cns, floats, paths, sim);
//                     temp_pic.push(vtx);
//                 }

//                 if (getNodeType(ndx_right, warpnum, cns) == 'ACN') {
//                     const vtx = createWeftVertex(ndx_right, fell_y, draft, flat_vtx_list, cns, floats, paths, sim);
//                     temp_pic.push(vtx);
//                 }
//             }

//         } else {

//             for (let j = warpnum - 1; j >= 0; j--) {
//                 const ndx_left = { i, j, id: 0 };
//                 const ndx_right = { i, j, id: 1 };


//                 if (getNodeType(ndx_right, warpnum, cns) == 'ACN') {
//                     const vtx = createWeftVertex(ndx_right, fell_y, draft, flat_vtx_list, cns, floats, paths, sim);
//                     temp_pic.push(vtx);
//                 }

//                 if (getNodeType(ndx_left, warpnum, cns) == 'ACN') {
//                     const vtx = createWeftVertex(ndx_left, fell_y, draft, flat_vtx_list, cns, floats, paths, sim);
//                     temp_pic.push(vtx);
//                 }
//             }
//         }

//         //updates the x and y values based on blocking of both front and back facing weft floats
//         temp_pic = alignXYValues(temp_pic, sim);



//         //given a particular theta, smooth the pick. Make sure the yarn cannot move more than theta away from the highest vertex. 
//         if (sim.use_smoothing) {
//             temp_pic = smoothPick(temp_pic, getMaterialStretch(sim.ms[material]), sim.max_theta, sim.warp_spacing);
//         }


//         //if we are rending full width add placeholder verticies and make sure they match the layer of the weft. 
//         if (!sim.wefts_as_written)
//             temp_pic = addPlaceholderVertices(temp_pic, i, direction, warpnum, cns, draft, sim);




//         path.vtxs = path.vtxs.concat(temp_pic);
//         path.pics.push(i);
//         fell_y = getFellY(flat_vtx_list.concat(path.vtxs));
//     }





//     //since we added vertexes at the edges of every float, places where a front and back facing float meet have two verticies. 
//     //we only need to render these as though they were a single vertex so we prune the vertices of these duplicates
//     paths = reduceVerticesAndSetOrientation(paths, warpnum, cns, sim);


//     return Promise.resolve(paths);


// }




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

            const face_val = getFace({ i, j, id: 0 }, warps, cns);
            let face = '-'
            if (face_val == true) face = "x";
            if (face_val == false) face = "o";

            cn_l = (cn_l == "A") ? getLayer({ i, j, id: 0 }, warps, cns).toString() : cn_l;
            cn_r = (cn_r == "A") ? getLayer({ i, j, id: 1 }, warps, cns).toString() : cn_r;
            cn_t = (cn_t == "A") ? getLayer({ i, j, id: 2 }, warps, cns).toString() : cn_t;
            cn_b = (cn_b == "A") ? getLayer({ i, j, id: 3 }, warps, cns).toString() : cn_b;


            row_ln_1 += `   ${cn_t}   `;
            row_ln_2 += ` ${cn_l} ${face} ${cn_r} `;
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
