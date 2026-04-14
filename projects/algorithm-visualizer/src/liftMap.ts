/**
 * A new concept for the simulation, that looks for sets of ACNS that form sub layers, (like circuits that create a continuous loop). It relies on the definition of "next" values for each ACN
 *
 *
 * CN NDX 0 -> NEXT is LEFT Edge Neighbor Float-> NDX #TOP, 2
 * CN NDX 1 -> NEXT is RIGHT Edge Neighbor Float -> NDX #BOTTOM, 3
 * CN NDX 2 -> NEXT is TOP Edge Neighbor Float -> NDX #RIGHT, 1
 * CN NDX 3 -> NEXT is BOTTOM Edge Neighbor Float -> NDX #LEFT, 0
 *
 * initialize a starting float map based on starting draft.  
 *
 * 1. Create a "SearchSet" from the float map, such that every Float contributes 2 ACNs to the ValidACNs LIst (e.g. left and right))
 *
 * 2. Create an empty layer set, initialized at Layer Id 0
 * LayerSet[LayerIndex] = [CN_Index..., CN_Index..., CN_Index...]
 *
 * 3. Create a map from every remaining ACN that follows the form:
 * CNMap = [CN_Index, Next_CN_Index]
 * To populate this CNMap, we will "walk the floats" by looking at the correct neighbor float, and if it's correct corresponding ACN index is not yet in SearchSet, then we add as this map entries "Next CN Index". If the visited ACN is not in the SearchSet, it means that it's already been visited and assigned to the layer, so the algorithm must continue walking in the appropriate direction until it finds an ACN that is part of the Search Set. In some cases. . If it doesn't find one, mark the neighbor as NULL.
 *
 * 4. Scan the CNMap list and look for any CNS that have "NULL" as they next value. Add those ACN to the LayerSet, and, remove them from the ValidACNs, and from the Map.
 *
 * 5. Create a set of all remaining ACN Indexes with ndx 1, call it "RightEdgeSet". Also initialize a list of groups, called LoopGroups, that will contain an array of objects including: the current ACN Index, a boolean flag for "valid", and a set of CN Indexes that are part of the "group".
 *
 * For each ACN in the RightEdgeSet, we're going to shoot rays that represent different walking paths.
 * First, we'll walk to the "next" direction, and shoot a ray of length l, adding every correctly positioned float we pass through to a list. 
 * Next, we'll call "next" on all the marked float ACNs.  SHooting a ray of length l from all those ACNs in the "next" direction.
 * We reepat this 5 times, and as we do, we add each ACN we visit to a "Loop Group"
 *
 * When we end the loop, if the starting CN is part of the loop group, we mark this ACN as belonging to the layer set. And we add JUST this ACN to the layer set. 
 * *
 * 6. AFter all ACns have been checked, we need to recreate the floatMap based on the ACNS that have been assigned layers. 
 * We do this by starting at the assigned ACN and walking 1/2 of the float length by walking the float that have been assigned to layers and merging or moving the neighbording floats, unmarked ACNs as required
 *
 * 7. Return the LayerSet.
 *
 * 
 * 
 * 
 */

import { createCell, getCellValue, getFloats, getWeftFloatLength, initContactNeighborhoods, modStrict, printDrawdown, updateCNs, warps, wefts, type CNFloat, type CNIndex, type ContactNeighborhood, type Drawdown } from "adacad-drafting-lib";
import { simVars } from "./simVars";
import { type LiftMapTraceEvent } from "./traceTypes";







/** ALGORITHMS FOR 4/14 */



export type LayerSet = Array<Array<CNFloat>>;

export const cnKey = (n: CNIndex): string => `${n.i},${n.j},${n.id}`;

const parseKey = (key: string): CNIndex => {
    const [is, js, ids] = key.split(",");
    return { i: Number(is), j: Number(js), id: Number(ids) };
};

export const normalizeNdx = (n: CNIndex, wefts: number, warps: number): CNIndex => ({
    i: modStrict(n.i, wefts),
    j: modStrict(n.j, warps),
    id: n.id,
});


const reconstituteFloats = (layer: Set<string>, floats: Array<CNFloat>, wefts: number, warps: number): Array<CNFloat> => {
    const updated_floats = [];

    console.log("ORIGINAL FLOATS", floats);

    for (const f of floats) {
        const left_set = layer.has(cnKey(normalizeNdx(f.left, wefts, warps)));
        const right_set = layer.has(cnKey(normalizeNdx(f.right, wefts, warps)));

        if (left_set && right_set) {
            updated_floats.push(f);
        } else if (left_set != right_set) {
            //push 1/2 length of the float into the float stack
        }
    }

    return updated_floats;
}


// const edgeStepKey = (fromKey: string, toKey: string): string => `${fromKey}|${toKey}`;


// const getNextCNInSearchSet = (
//     ndx: CNIndex,
//     floats: Array<CNFloat>,
//     searchSet: ReadonlySet<string>,
//     wefts: number,
//     warps: number,
// ): NextInSearchSet | null => {
//     if (ndx.id == 0 || ndx.id == 1) {
//         let j_offset = (ndx.id == 0) ? -1 : 1;
//         while (j_offset < warps - 1) {
//             const j_adj = modStrict(ndx.j + j_offset, warps);
//             const float = getWarpFloat(ndx.i, j_adj, wefts, warps, floats);
//             if (float == null) return null;

//             let acn = (ndx.id == 0) ? float.left : float.right;
//             const acnNorm = normalizeNdx(acn, wefts, warps);
//             const acnKey = cnKey(acnNorm);
//             if (searchSet.has(acnKey)) {
//                 return { acn: acnNorm, floatId: float.id };
//             }
//             j_offset++;
//         }
//         return null;
//     }
//     else if (ndx.id == 2 || ndx.id == 3) {
//         let i_offset = (ndx.id == 2) ? -1 : 1;
//         while (i_offset < wefts - 1) {
//             const i_adj = modStrict(ndx.i + i_offset, wefts);
//             const float = getWeftFloat(i_adj, ndx.j, wefts, warps, floats);
//             if (float == null) return null;

//             let acn = (ndx.id == 2) ? float.right : float.left;
//             const acnNorm = normalizeNdx(acn, wefts, warps);
//             const acnKey = cnKey(acnNorm);
//             if (searchSet.has(acnKey)) {
//                 return { acn: acnNorm, floatId: float.id };
//             }
//             i_offset++;
//         }
//         return null;
//     }

//     return null;
// }



//collect next values in as an array of nexts that are within range of the key
const buildNextMap = (
    searchSet: ReadonlySet<string>,
    floats: Array<CNFloat>,
    threshold: number,
    wefts: number,
    warps: number,
): Map<string, Array<string>> => {
    const cnMap = new Map<string, Array<string>>();
    console.log("Search Set is: ", searchSet);
    for (const key of searchSet) {
        const nxt = getLiftSet(parseKey(key), threshold, wefts, warps, searchSet, floats);
        cnMap.set(key, nxt.map(el => cnKey(el)));

    }
    console.log(cnMap);
    return cnMap;
};


export const castRay = (origin: CNIndex, threshold: number, wefts: number, warps: number, searchSet: ReadonlySet<string>): Array<CNIndex> => {

    const ray = [];
    //cast left side of the float
    if (origin.id == 0) {
        for (let j = 0; j < threshold; j++) {
            const ndx = { i: modStrict(origin.i, wefts), j: modStrict(origin.j - j, warps), id: origin.id };
            if (searchSet.has(cnKey(ndx))) {
                ray.push(ndx);
            }
        }
        return filterDuplicates(ray);
    }
    //cast right side of the float
    else if (origin.id == 1) {
        for (let j = 0; j < threshold; j++) {
            const ndx = { i: modStrict(origin.i, wefts), j: modStrict(origin.j + j, warps), id: origin.id };
            if (searchSet.has(cnKey(ndx))) {
                ray.push(ndx);
            }
        }
        return filterDuplicates(ray);
    }
    //cast top side of the float
    else if (origin.id == 2) {
        for (let i = 0; i < threshold; i++) {
            const ndx = { i: modStrict(origin.i - i, wefts), j: modStrict(origin.j, warps), id: origin.id };
            if (searchSet.has(cnKey(ndx))) {
                ray.push(ndx);
            }
        }
        return filterDuplicates(ray);
    } else if (origin.id == 3) {
        for (let i = 0; i < threshold; i++) {
            const ndx = { i: modStrict(origin.i + i, wefts), j: modStrict(origin.j, warps), id: origin.id };
            if (searchSet.has(cnKey(ndx))) {
                ray.push(ndx);
            }
        }
        return filterDuplicates(ray);
    }
    return [];

}


export const followTheNexts = (origin: CNIndex, stopping_id: number, cnMap: Map<string, Array<string>>, threshold: number, searchSet: ReadonlySet<string>, wefts: number, warps: number, touched: Set<string>): Set<string> => {


    const nexts = cnMap.get(cnKey(origin));
    const next_array = nexts ? [...nexts] : [];

    if (next_array.length == 0) return touched;

    //before stopping, add all the nexts along this trajectory
    if (parseKey(next_array[0]).id == stopping_id) {
        for (const next of next_array) {
            touched.add(next);
        }
        return touched;
    }

    for (const next of next_array) {
        if (!touched.has(next)) {
            touched.add(next);
            const traces = followTheNexts(parseKey(next), stopping_id, cnMap, threshold, searchSet, wefts, warps, touched);
            for (const trace of traces) {
                touched.add(trace);
            }
        }
    }
    return touched;
}

/** casts nets out from the start key to the next 5 warp and weft floats that would lift as a result */
//
export const emitLiftPaths = (origin: CNIndex, cnMap: Map<string, Array<string>>, threshold: number, searchSet: ReadonlySet<string>, wefts: number, warps: number): Set<string> => {


    const touched = new Set<string>();
    const starting_ray = castRay(origin, threshold, wefts, warps, searchSet);
    console.log("STARTING RAY", starting_ray);
    for (const acn of starting_ray) {
        const traces = followTheNexts(acn, origin.id, cnMap, threshold, searchSet, wefts, warps, touched);
        for (const trace of traces) {
            touched.add(trace);
        }
    }
    return touched;
}

/**
 * this algorithm determines which floats are part of the current top layer
 * @param floats 
 * @param wefts 
 * @param warps 
 * @returns 
 */
const peelLayer = (floats: Array<CNFloat>, wefts: number, warps: number, threshold: number): Array<CNFloat> => {

    const layer: CNIndex[] = [];
    const searchSet = new Set<string>();


    const full_weft_floats = floats.filter(el => el.face == false && el.right.j - el.left.j == warps - 1);
    const full_warp_floats = floats.filter(el => el.face == true && el.right.i - el.left.i == wefts - 1);

    //handle cases where we have an unbound layer. 
    if (full_weft_floats.length > 0) {
        return full_weft_floats;
    }

    if (full_warp_floats.length > 0) {
        return full_warp_floats;
    }

    //now we can promise that there aren't any full wefts in teh set. 
    for (const f of floats) {
        searchSet.add(cnKey(normalizeNdx(f.left, wefts, warps)));
        searchSet.add(cnKey(normalizeNdx(f.right, wefts, warps)));
    }


    const cnMap = buildNextMap(searchSet, floats, threshold, wefts, warps);
    console.log("CN MAP", cnMap);
    for (const startKey of [...searchSet]) {
        console.log("START KEY", startKey);
        const touched = emitLiftPaths(parseKey(startKey), cnMap, threshold, searchSet, wefts, warps);
        console.log("TOUCHED", touched);
        if (touched.has(cnKey(parseKey(startKey)))) {
            console.log("ADDING TO LAYER", parseKey(startKey));
            layer.push(parseKey(startKey));
        }
    }

    const layerSet = new Set<string>();
    for (const el of layer) {
        layerSet.add(cnKey(el));
    }
    return reconstituteFloats(layerSet, floats, wefts, warps);



}


//Walks through any warp floats in the new floats list, and marks those warp floats as "heddle down", in teh drawdown (essentially casting them out)
const castOutWarpFloats = (dd_warp_co: Drawdown, newFloats: Array<CNFloat>, warps: number, wefts: number) => {

    let updated: Drawdown = copyDrawdown(dd_warp_co);
    for (const f of newFloats) {
        if (f.face == true) {
            for (let i = f.left.i; i <= f.right.i; i++) {
                let norm_i = modStrict(i, wefts);
                let norm_j = modStrict(f.left.j, warps);
                updated[norm_i][norm_j] = createCell(false);
            }
        }
    }
    return updated;
}

//Walks through any warp floats in the new floats list, and marks those warp floats as "heddle down", in teh drawdown (essentially casting them out)
const castOutWeftFloats = (dd_weft_co: Drawdown, newFloats: Array<CNFloat>, warps: number, wefts: number) => {
    let updated: Drawdown = copyDrawdown(dd_weft_co);
    for (const f of newFloats) {
        if (f.face == false) {
            for (let j = f.left.j; j <= f.right.j; j++) {
                let norm_i = modStrict(f.left.i, wefts);
                let norm_j = modStrict(j, warps);
                updated[norm_i][norm_j] = createCell(true);
            }
        }
    }
    return updated;
}



const isValidWarpFloat = (float: CNFloat, wefts: number, assignedACNS: Set<string>): boolean => {

    //all floats that do not fun full width are valid
    if (float.right.i - float.left.i < wefts) return true


    //this full length float is just a product of the casting out. 
    if (assignedACNS.has(cnKey(float.left)) && assignedACNS.has(cnKey(float.right))) return false;

    return true;

}

const isValidWeftFloat = (float: CNFloat, warps: number, assignedACNS: Set<string>): boolean => {

    //all floats that do not fun full width are valid
    if (float.right.j - float.left.j < warps) return true


    //this full length float is just a product of the casting out. 
    if (assignedACNS.has(cnKey(float.left)) && assignedACNS.has(cnKey(float.right))) return false;

    return true;

}


/**
 * after peeling a layer, update two drawndowns that are used to create new float maps 
 * based on teh peeled layers being cast out. 
 * This function is not absoltute, the drawdowns and new floats, will be progressively updated in each loop
 * it also strips out any floats that span the entire width or height of the draft that have already been asigned to a layer. 
 * @param dd_warp_co 
 * @param dd_weft_co 
 * @param newFloats 
 * @returns 
 */
const updateMap = async (dd_warp_co: Drawdown, dd_weft_co: Drawdown, warps: number, wefts: number, newFloats: Array<CNFloat>, assignedACNS: Set<string>) => {

    //for each warp float - mark the dd_warp_co cells associated as "heddle lower"
    // init CNS - 
    const updated_dd_warp_co = castOutWarpFloats(dd_warp_co, newFloats, warps, wefts);

    let emptyCns = await initContactNeighborhoods(updated_dd_warp_co);
    let cns = await updateCNs(emptyCns, wefts, warps, simVars);
    let floats = await getFloats(wefts, warps, cns);
    const weft_floats = floats
        .filter(el => el.face == false)
        .filter(el => isValidWeftFloat(el, warps, assignedACNS));

    //for each weft float - mark the dd_weft_co cells associated as "heddle raised"
    const updated_dd_weft_co = castOutWeftFloats(dd_weft_co, newFloats, warps, wefts);
    emptyCns = await initContactNeighborhoods(updated_dd_weft_co);
    cns = await updateCNs(emptyCns, wefts, warps, simVars);
    floats = await getFloats(wefts, warps, cns);
    const warp_floats =
        floats.filter(el => el.face == true)
            .filter(el => isValidWarpFloat(el, wefts, assignedACNS));

    const all_floats = [...weft_floats, ...warp_floats];

    console.log("DD WARP CO in update map");
    printDrawdown(updated_dd_warp_co)
    console.log("DD WEFT CO in update map");
    printDrawdown(updated_dd_weft_co)

    return { dd_warp_co: updated_dd_warp_co, dd_weft_co: updated_dd_weft_co, all_floats };
}

const extractACNS = (floats: Array<CNFloat>): Array<CNIndex> => {

    const acns = [];
    for (const f of floats) {
        acns.push(f.left);
        acns.push(f.right);
    }
    return acns;

}



const copyDrawdown = (dd: Drawdown): Drawdown => {
    return dd.map(row => row.map(cell => createCell(getCellValue(cell))));
}

/** parses the drawdown in search of possible layers, updating and assign ACNS as they correspond to floats in the lifted structures**/
export const createLayerSet = async (drawdown: Drawdown, warps: number, wefts: number, threshold: number): Promise<LayerSet> => {
    const layerSet: LayerSet = [];
    const assignedACNS = new Set<string>();
    let dd_warp_co = copyDrawdown(drawdown);
    let dd_weft_co = copyDrawdown(drawdown);
    let floats = [];

    let obj = await updateMap(dd_warp_co, dd_weft_co, warps, wefts, floats, assignedACNS);
    dd_warp_co = obj.dd_warp_co;
    dd_weft_co = obj.dd_weft_co;
    floats = obj.all_floats;


    let loops = 1;
    //  while (floats.length > 0) {
    while (loops < 5) {
        const layer_floats = peelLayer(floats, wefts, warps, threshold);
        console.log("LAYER FLOATS", layer_floats);
        layerSet.push(layer_floats);

        for (const cn of extractACNS(layer_floats)) {
            assignedACNS.add(cnKey(cn));
        }


        obj = await updateMap(dd_warp_co, dd_weft_co, warps, wefts, layer_floats, assignedACNS);


        dd_warp_co = obj.dd_warp_co;
        dd_weft_co = obj.dd_weft_co;
        floats = obj.all_floats;
        loops++;
    }





    return layerSet;

}

/**












// /**
//  * checks both float positions to determine if and how they are wrapping edges. If both warp or do not, no changes need to be made
//  * if one wraps and the other doesn't we need to check if we need to shift the unwrapped float to match. this is only required if the two warps aren't attached automatically.
//  * @param ar - the right edge of the attached float
//  * @param al - the left edge of the attached float
//  * @param fr - the right edge of the float
//  * @param fl - the left edge of the float
//  * @param warps - the number of warps in the draft
//  * @returns
//  */

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



// /**
//  * checks if the point i, j resides on the float. 
//  * @param i 
//  * @param j 
//  * @param warps 
//  * @param float 
//  * @returns 
//  */
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




const checkWarpIndexInRange = (i: number, j: number, wefts: number, float: CNFloat): boolean => {
    if (float.face == false || float.face == null) return false;
    if (float.left.j !== j) return false;

    if (float.right.i < wefts) {
        return i >= float.left.i && i <= float.right.i;
    } else {
        return (i >= 0 && i <= modStrict(float.right.i, wefts)) || (i >= float.left.i && i < wefts);
    }


}

// /**
//  * given a point, this function returns the float upon which this point sits
//  * @param i 
//  * @param j 
//  */
export const getWarpFloat = (i: number, j: number, wefts: number, warps: number, all_floats: Array<CNFloat>): CNFloat | null => {
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







// /** Each entry is one layer: the list of contact indices assigned to that layer (order is not significant). */
// export type LayerSet = Array<Array<CNIndex>>;

// export const cnKey = (n: CNIndex): string => `${n.i},${n.j},${n.id}`;

// const parseKey = (key: string): CNIndex => {
//     const [is, js, ids] = key.split(",");
//     return { i: Number(is), j: Number(js), id: Number(ids) };
// };

// export const normalizeNdx = (n: CNIndex, wefts: number, warps: number): CNIndex => ({
//     i: modStrict(n.i, wefts),
//     j: modStrict(n.j, warps),
//     id: n.id,
// });


const sameIndex = (a: CNIndex, b: CNIndex): boolean => a.i == b.i && a.j == b.j;


// const onRay = (start: CNIndex, lastLift: CNIndex, end: CNIndex, threshold: number): boolean => {
//     if (start.id == 1 || start.id == 0) {


//         //check if it's in line with the last warp lift
//         if (lastLift.j == start.j) {
//             if (Math.abs(start.i - lastLift.i) < threshold) return true;
//         }

//         //check if it's in line with the last weft lift
//         if (end.i == start.i) {
//             if (Math.abs(start.j - end.j) < threshold) return true;
//         }
//     }

//     if (start.id == 2 || start.id == 3) {
//         if (lastLift.i == start.i) {
//             if (Math.abs(start.j - lastLift.j) < threshold) return true;
//         }

//         if (end.j == start.j) {
//             if (Math.abs(start.i - end.i) < threshold) return true;
//         }
//     }

//     return false;

// }
// /**
//  * @param startKey 
//  * @param chain 
//  * @returns 
//  */
// const hasValidLoop = (startKey: string, touched: Set<string>): boolean => {

//     if (touched.has(startKey)) return true;
//     return false;



// }


type NextInSearchSet = { acn: CNIndex; floatId: number };

// const getNextCNInSearchSet = (
//     ndx: CNIndex,
//     floats: Array<CNFloat>,
//     searchSet: ReadonlySet<string>,
//     wefts: number,
//     warps: number,
// ): NextInSearchSet | null => {
//     if (ndx.id == 0 || ndx.id == 1) {
//         let j_offset = (ndx.id == 0) ? -1 : 1;
//         while (j_offset < warps - 1) {
//             const j_adj = modStrict(ndx.j + j_offset, warps);
//             const float = getWarpFloat(ndx.i, j_adj, wefts, warps, floats);
//             if (float == null) return null;

//             let acn = (ndx.id == 0) ? float.left : float.right;
//             const acnNorm = normalizeNdx(acn, wefts, warps);
//             const acnKey = cnKey(acnNorm);
//             if (searchSet.has(acnKey)) {
//                 return { acn: acnNorm, floatId: float.id };
//             }
//             j_offset++;
//         }
//         return null;
//     }
//     else if (ndx.id == 2 || ndx.id == 3) {
//         let i_offset = (ndx.id == 2) ? -1 : 1;
//         while (i_offset < wefts - 1) {
//             const i_adj = modStrict(ndx.i + i_offset, wefts);
//             const float = getWeftFloat(i_adj, ndx.j, wefts, warps, floats);
//             if (float == null) return null;

//             let acn = (ndx.id == 2) ? float.right : float.left;
//             const acnNorm = normalizeNdx(acn, wefts, warps);
//             const acnKey = cnKey(acnNorm);
//             if (searchSet.has(acnKey)) {
//                 return { acn: acnNorm, floatId: float.id };
//             }
//             i_offset++;
//         }
//         return null;
//     }

//     return null;
// }


// const edgeStepKey = (fromKey: string, toKey: string): string => `${fromKey}|${toKey}`;

// const buildCnMapWithEdgeFloats = (
//     searchSet: ReadonlySet<string>,
//     floats: Array<CNFloat>,
//     wefts: number,
//     warps: number,
// ): { cnMap: Map<string, string | null>; stepFloatId: Map<string, number> } => {
//     const cnMap = new Map<string, string | null>();
//     const stepFloatId = new Map<string, number>();
//     for (const key of searchSet) {
//         const nxt = getNextCNInSearchSet(parseKey(key), floats, searchSet, wefts, warps);
//         if (!nxt) {
//             cnMap.set(key, null);
//         } else {
//             const toKey = cnKey(nxt.acn);
//             cnMap.set(key, toKey);
//             stepFloatId.set(edgeStepKey(key, toKey), nxt.floatId);
//         }
//     }
//     return { cnMap, stepFloatId };
// };

// export interface LiftMapBuildResult {
//     layerSet: LayerSet;
//     trace: LiftMapTraceEvent[];
// }


/**
 * given an ACN, this function casts a ray in the search direction, returns a set of ACNs that are within the threshold of the origin ACN.
 * @param origin 
 * @param threshold 
 * @param wefts 
 * @param warps 
 * @param searchSet 
 * @returns 
 */
const getLiftSet = (origin: CNIndex, threshold: number, wefts: number, warps: number, searchSet: ReadonlySet<string>, floats: Array<CNFloat>): Array<CNIndex> => {
    const liftSet: Array<CNIndex> = [];

    console.log("SEARCHING FOR ", origin);


    //I am an ACN on a weft float, left side, look one column left and walk UP
    if (origin.id == 0) {
        const search_start = { i: origin.i, j: modStrict(origin.j - 1, warps), id: origin.id };
        for (let i = 0; i < threshold; i++) {
            if (searchSet.has(cnKey({ i: modStrict(search_start.i - i, wefts), j: modStrict(search_start.j, warps), id: 2 }))) {
                liftSet.push({ i: modStrict(search_start.i - i, wefts), j: modStrict(search_start.j, warps), id: 2 });
            }
        }

        //if we end on a float, get it's end point
        const float = getWarpFloat(modStrict(search_start.i - threshold, wefts), search_start.j, wefts, warps, floats);
        if (float == null) return liftSet;
        liftSet.push({ i: modStrict(float.left.i, wefts), j: modStrict(float.left.j, warps), id: float.left.id });

    }
    //I am an ACN on a weft float, Right side, look one column right and walk DOWN
    if (origin.id == 1) {
        const search_start = { i: origin.i, j: modStrict(origin.j + 1, warps), id: origin.id };
        for (let i = 0; i < threshold; i++) {
            if (searchSet.has(cnKey({ i: modStrict(search_start.i + i, wefts), j: modStrict(search_start.j, warps), id: 3 }))) {
                liftSet.push({ i: modStrict(search_start.i + i, wefts), j: modStrict(search_start.j, warps), id: 3 });
            }
        }
        //if we end on a float, get it's end point
        const float = getWarpFloat(modStrict(search_start.i + threshold, wefts), search_start.j, wefts, warps, floats);
        if (float == null) return liftSet;
        liftSet.push({ i: modStrict(float.right.i, wefts), j: modStrict(float.right.j, warps), id: float.right.id });
    }

    //I am an ACN on a warp float, Top side, look one row up and walk RIGHT
    if (origin.id == 2) {
        const search_start = { i: modStrict(origin.i - 1, wefts), j: origin.j, id: origin.id };
        for (let j = 0; j < threshold; j++) {
            if (searchSet.has(cnKey({ i: modStrict(search_start.i, wefts), j: modStrict(search_start.j + j, warps), id: 1 }))) {
                liftSet.push({ i: modStrict(search_start.i, wefts), j: modStrict(search_start.j + j, warps), id: 1 });
            }
        }
        //if we end on a float, get it's end point
        const float = getWeftFloat(search_start.i, modStrict(search_start.j + threshold, warps), wefts, warps, floats);
        if (float == null) return liftSet;
        liftSet.push({ i: modStrict(float.right.i, wefts), j: modStrict(float.right.j, warps), id: float.right.id });
    }

    // I am an ACN on a warp float, Bottom Side, Look one row down and walk LEFT
    else if (origin.id == 3) {
        const search_start = { i: modStrict(origin.i + 1, wefts), j: origin.j, id: origin.id };
        for (let j = 0; j < threshold; j++) {
            if (searchSet.has(cnKey({ i: modStrict(search_start.i, wefts), j: modStrict(search_start.j - j, warps), id: 0 }))) {
                liftSet.push({ i: modStrict(search_start.i, wefts), j: modStrict(search_start.j - j, warps), id: 0 });
            }
        }
        //if we end on a float, get it's end point
        const float = getWeftFloat(search_start.i, modStrict(search_start.j - threshold, warps), wefts, warps, floats);
        if (float == null) return liftSet;
        liftSet.push({ i: modStrict(float.left.i, wefts), j: modStrict(float.left.j, warps), id: float.left.id });
    }

    //there shouldn't be any duplicates but just in case
    return filterDuplicates(liftSet);
}

const filterDuplicates = (liftSet: Array<CNIndex>): Array<CNIndex> => {
    return liftSet.filter((acn, index, self) =>
        index === self.findIndex((t) => t.i === acn.i && t.j === acn.j && t.id === acn.id)
    );
}





// /**
//  * TODO - update this function to consider layers. 
//  * uses the contact neighborhoods on this row to get a list of floats. Some floats may be out of range (> warps) in the case where the pattern would repeat and wrap
//  * @param i 
//  * @param warps 
//  * @param cns 
//  * @returns 
//  */
// export const getRowAsFloats = (i: number, warps: number, searchSet: ReadonlySet<string>): Array<CNFloat> => {


//     const floats: Array<CNFloat> = [];
//     const lefts = Array.from(searchSet).filter(el => parseKey(el).id == 0);
//     const rights = Array.from(searchSet).filter(el => parseKey(el).id == 1);
//     if (lefts.length !== rights.length) console.error("THIS ROW HAS AN UNEVEN NUMBER OF ACNS")


//     lefts.forEach(left => {
//         let found = false;

//         for (let j = left.ndx.j; j < warps && !found; j++) {
//             const right = rights.find(el => el.ndx.j == j);
//             if (right !== undefined) {
//                 found = true;
//                 floats.push({
//                     id: -1,
//                     left: left.ndx,
//                     right: right.ndx,
//                     edge: false,
//                     face: left.face,
//                     blocking: []
//                 })
//             }
//         }

//         if (!found) {
//             const right = rights.shift();
//             if (right !== undefined) {
//                 floats.push({
//                     id: -1,
//                     left: left.ndx,
//                     right: { i: right.ndx.i, j: warps + right.ndx.j, id: 1 }, //get the first in the list
//                     edge: false,
//                     face: left.face,
//                     blocking: []
//                 })
//             }
//         }


//     })

//     return floats;


// }


// //CREATE A BASIC MAP OF WHERE THE FLOATS ARE PLACED 
// const createMergeMap = (searchSet: ReadonlySet<string>, floats: Array<CNFloat>, wefts: number, warps: number){

//     const WEFT_FLOAT = 0;
//     const WARP_FLOAT = 1;
//     const NO_FLOAT = -1;

//     const mergeMap = new Array<Array<number>>(wefts).fill(new Array<number>(warps).fill(NO_FLOAT));


//     for (const f of floats) {

//         if (searchSet.has(cnKey(f.left)) && searchSet.has(cnKey(f.right))) {

//             if (f.face) {
//                 for (let i = f.left.i; i < f.right.i; i++) {
//                     mergeMap[i][f.left.j] = WARP_FLOAT;
//                 }
//             } else {
//                 for (let j = f.left.j; j < f.right.j; j++) {
//                     mergeMap[f.left.i][j] = WEFT_FLOAT;
//                 }
//             }


//         } else if (searchSet.has(cnKey(f.left)) != searchSet.has(cnKey(f.right))) {

//             const left_is_active = searchSet.has(cnKey(f.left));

//             if (f.face) {
//                 const half_dist = Math.ceil((f.right.i - f.left.i) / 2);

//                 for (let i = f.left.i; i < f.right.i; i++) {
//                     if ((left_is_active && i <= f.left.i + half_dist) || (!left_is_active && i >= f.right.i - half_dist)) {
//                         mergeMap[i][f.left.j] = WARP_FLOAT;
//                     }
//                 }
//             } else {
//                 const half_dist = Math.ceil((f.right.j - f.left.j) / 2);

//                 for (let j = f.left.j; j < f.right.j; j++) {
//                     if ((left_is_active && j <= f.left.j + half_dist) || (!left_is_active && j >= f.right.j - half_dist)) {
//                         mergeMap[f.left.i][j] = WEFT_FLOAT;
//                     }
//                 }
//             }


//         }
//         return mergeMap;
//     }


//     const floatIsActive = (f: CNFloat, searchSet: ReadonlySet<string>, wefts: number, warps: number): boolean => {
//         let left_acn = searchSet.has(cnKey(normalizeNdx(f.left, wefts, warps)));
//         let right_acn = searchSet.has(cnKey(normalizeNdx(f.right, wefts, warps)));
//         if (left_acn && right_acn) return true;
//         if (left_acn != right_acn) console.error("a float is active on only one side");
//         return false;

//     }

//     const extendFloats = (mergeMap: Array<Array<number>>, wefts: number, warps: number): Array<CNFloat> => {
//         const WEFT_FLOAT = 0;
//         const WARP_FLOAT = 1;
//         const NO_FLOAT = -1;
//         let last = NO_FLOAT;

//         //WALK ALONG THE WEFTS
//         for (let i = 0; i < wefts; i++) {
//             for (let j = 0; j < warps; j++) {

//                 if (mergeMap[i][j] == NO_FLOAT) {
//                     if (last == WEFT_FLOAT) {
//                         mergeMap[i][j] = WEFT_FLOAT;
//                     }
//                 }

//                 last = mergeMap[i][j];
//             }

//             //do it again just to make sure we assign the front ones if they are missing
//             for (let j = 0; j < warps; j++) {

//                 if (mergeMap[i][j] == NO_FLOAT) {
//                     if (last == WEFT_FLOAT) {
//                         mergeMap[i][j] = WEFT_FLOAT;
//                     }
//                 } else {
//                     break;
//                 }

//                 last = mergeMap[i][j];
//             }
//         }

//         //WALK ALONG THE WARPS
//         for (let j = 0; j < warps; j++) {
//             for (let i = 0; i < wefts; i++) {

//                 if (mergeMap[i][j] == NO_FLOAT) {
//                     if (last == WARP_FLOAT) {
//                         mergeMap[i][j] = WARP_FLOAT;
//                     }
//                 }

//                 last = mergeMap[i][j];
//             }

//             //do it again just to make sure we assign the front ones if they are missing
//             for (let i = 0; i < wefts; i++) {

//                 if (mergeMap[i][j] == NO_FLOAT) {
//                     if (last == WARP_FLOAT) {
//                         mergeMap[i][j] = WARP_FLOAT;
//                     }
//                 } else {
//                     break;
//                 }

//                 last = mergeMap[i][j];
//             }
//         }
//     }



//     const updateFloatsFromMergeMap = (mergeMap: Array<Array<number>>, wefts: number, warps: number): Array<CNFloat> => {


//         //TODO, check this to make sure it rights when the weft closes! 

//         const updatedFloats: Array<CNFloat> = [];
//         //start by pushing any weft floats
//         for (let i = 0; i < wefts; i++) {
//             let weft_open = false;
//             let start_j = 0;
//             for (let j = 0; j < warps; j++) {
//                 if (mergeMap[i][modStrict(j, warps)] == WEFT_FLOAT) {
//                     if (!weft_open) {
//                         weft_open = true;
//                         start_j = j;
//                     }

//                 } else {
//                     if (weft_open == true) {
//                         const f: CNFloat = {
//                             id: updatedFloats.length,
//                             left: { i: i, j: start_j, id: 0 },
//                             right: { i: i, j: j - 1, id: 1 },
//                             face: false,
//                             edge: false,
//                             blocking: []
//                         }
//                         updatedFloats.push(f);
//                         weft_open = false;
//                     }

//                 }
//             }
//             //if we get to the end here and we're still on an open float, close it. 

//             if (weft_open == true) {
//                 const j_break = mergeMap[i].findIndex(el => el == WARP_FLOAT);
//                 if (j_break != -1) {
//                     const f: CNFloat = {
//                         id: updatedFloats.length,
//                         left: { i: i, j: start_j, id: 0 },
//                         right: { i: i, j: warps + j_break - 1, id: 1 },
//                         face: false,
//                         edge: false,
//                         blocking: []
//                     }
//                     updatedFloats.push(f);
//                 } else {
//                     //then this just spanned the whole thing
//                     const f: CNFloat = {
//                         id: updatedFloats.length,
//                         left: { i: i, j: start_j, id: 0 },
//                         right: { i: i, j: warps - 1, id: 1 },
//                         face: false,
//                         edge: false,
//                         blocking: []
//                     }
//                     updatedFloats.push(f);
//                 }

//             }

//         }


//         //TODO REPEAT FOR WARPS


//     }


//     //WALK THE WARPS AND WEFTS. 
//     //GET A PAIR OF NEIGHBORDING WEFT FLOATS. 
//     //GET ALL THE WARP FLOATS IN BETWEEN THESE TWO WEFT FLOATS
//     // IF THEIR BOTH ACNS HAVE BEEN TAKEN OUT OF THE SET, REMOVE
//     // IF ONLY ONE HAS BEEN TAKEN OUT, SEE IF THIS IS WITHIN THE 1/2 RANGE FROM THIS EDGE.
//     // IF THERE WAS SOMETHING IN BETWEEN (BUT IT IS LESS THAN THE FULL WIDTH), EXTEND THE EDGES

//     export const updateAndMergeWeftFloats = (searchSet: ReadonlySet<string>, floats: Array<CNFloat>, wefts: number, warps: number): Array<CNFloat> => {

//         //MAKE SURE THIS ALIGNS WITH MERGE MAP FUNCTION


//         const mergeMap = createMergeMap(searchSet, floats, wefts, warps);
//         console.log("MERGE MAP", mergeMap);

//         const extendedMap = extendFloats(mergeMap, wefts, warps);
//         console.log("EXTENDED MAP", extendedMap);

//         //reposition the floats based on the merge mapk and update the ACNS
//         const updatedFloats = updateFloatsFromMergeMap(extendedMap, wefts, warps);

//         return updatedFloats;


//     }





//     /**
//      * Builds layer groups from float endpoints using the lift-map walk described above.
//      * Emits a step trace for visualization (see `LiftMapTraceEvent`).
//      */
//     export const buildLiftMapWithTrace = (
//         floats: Array<CNFloat>,
//         wefts: number,
//         warps: number,
//     ): LiftMapBuildResult => {

//         const trace: LiftMapTraceEvent[] = [];
//         const layerSet: LayerSet = [];
//         const searchSet = new Set<string>();

//         for (const f of floats) {
//             searchSet.add(cnKey(normalizeNdx(f.left, wefts, warps)));
//             searchSet.add(cnKey(normalizeNdx(f.right, wefts, warps)));
//         }

//         const addToLayerUnique = (layer: CNIndex[], key: string, dedupe: Set<string>) => {
//             const addOne = (k: string) => {
//                 if (dedupe.has(k)) {
//                     return;
//                 }
//                 dedupe.add(k);
//                 layer.push(parseKey(k));
//             };
//             addOne(key);
//         };

//         while (searchSet.size > 0) {


//             const threshold = (simVars as { neighbor_lift_threshold?: number }).neighbor_lift_threshold ?? 10;
//             const layerIndex = layerSet.length;
//             trace.push({ type: "layer_begin", layer_index: layerIndex });

//             const layer: CNIndex[] = [];
//             const dedupe = new Set<string>();

//             //First build with to search for null values. 
//             let { cnMap, stepFloatId } = buildCnMapWithEdgeFloats(searchSet, floats, wefts, warps);

//             const nullKeys = [...searchSet].filter((k) => cnMap.get(k) === null);
//             for (const k of nullKeys) {
//                 trace.push({ type: "null_candidate", acn_key: k });
//                 searchSet.delete(k);
//                 const lenBefore = layer.length;
//                 addToLayerUnique(layer, k, dedupe);
//                 if (layer.length > lenBefore) {
//                     trace.push({ type: "add_acn_layer", acn_key: k, layer_index: layerIndex, reason: "null_next" });
//                 }
//             }

//             //Then rebuild the cnMap with the remaining ACNs. 
//             if (searchSet.size > 0) {
//                 const rebuilt = buildCnMapWithEdgeFloats(searchSet, floats, wefts, warps);
//                 cnMap = rebuilt.cnMap;
//                 stepFloatId = rebuilt.stepFloatId;
//             }

//             for (const startKey of [...searchSet]) {

//                 trace.push({ type: "loop_seed", acn_key: startKey });
//                 let cur = startKey;
//                 const chain: string[] = [];

//                 const touched = emitLiftPaths(startKey, cnMap, threshold, wefts, warps, searchSet, floats);

//                 const vl = hasValidLoop(
//                     startKey,
//                     touched);
//                 trace.push({ type: "loop_outcome", start_key: startKey, valid: vl });
//                 if (vl) {
//                     const loopNodes = new Set<string>([startKey, ...chain]);
//                     for (const nk of loopNodes) {
//                         const lenBefore = layer.length;
//                         addToLayerUnique(layer, nk, dedupe);
//                         if (layer.length > lenBefore) {
//                             trace.push({ type: "add_acn_layer", acn_key: nk, layer_index: layerIndex, reason: "loop" });
//                         }
//                     }
//                 }

//             }

//             //CHECK FOR FLOATS HERE



//             for (const k of dedupe) {
//                 searchSet.delete(k);
//             }

//             trace.push({ type: "layer_end", layer_index: layerIndex });

//             if (layer.length > 0) {
//                 layerSet.push(layer);
//             }





//             if (searchSet.size === 0) {
//                 break;
//             }

//             //this performs a merge that essentially takes out removed floats
//             floats = updateAndMergeFloats(searchSet, layer, updatedFloats, wefts, warps);


//             if (nullKeys.length === 0 && dedupe.size === 0) {
//                 const remainderKeys = [...searchSet];
//                 trace.push({
//                     type: "terminate_remainder",
//                     acn_keys: remainderKeys,
//                     layer_index: layerSet.length,
//                 });
//                 const remainder: CNIndex[] = remainderKeys.map((k) => parseKey(k));
//                 layerSet.push(remainder);
//                 break;
//             }
//         }

//         return { layerSet, trace };
//     };

//     /**
//      * Builds layer groups from float endpoints using the lift-map walk described above.
//      * @param floats - floats to analyze (typically all floats for the draft)
//      * @param wefts - row count (simulation grid height)
//      * @param warps - column count (simulation grid width)
//      */
//     export const buildLiftMap = (floats: Array<CNFloat>, wefts: number, warps: number): LayerSet =>
//         buildLiftMapWithTrace(floats, wefts, warps).layerSet;
//     function initializeCNs(wefts: (d: Drawdown | Array<Array<boolean>>) => number, warps: (d: Drawdown | Array<Array<boolean>>) => number) {
//         throw new Error("Function not implemented.");
//     }

//     function initializeFloats(cns: any) {
//         throw new Error("Function not implemented.");
//     }

