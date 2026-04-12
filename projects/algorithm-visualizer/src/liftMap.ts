/**
 * A new concept for the simulation, that looks for sets of ACNS that form sub layers, (like circuits that create a continuous loop). It relies on the definition of "next" values for each ACN
 *
 *
 * CN NDX 0 -> NEXT is LEFT Edge Neighbor Float-> NDX #TOP, 2
 * CN NDX 1 -> NEXT is RIGHT Edge Neighbor Float -> NDX #BOTTOM, 3
 * CN NDX 2 -> NEXT is TOP Edge Neighbor Float -> NDX #RIGHT, 1
 * CN NDX 3 -> NEXT is BOTTOM Edge Neighbor Float -> NDX #LEFT, 0
 *
 *
 *
 * 1. Create a "SearchSet" from the float map, such that every Float contributes 2 ACNs to the ValidACNs LIst (e.g. left and right))
 *
 * 2. Create an empty layer set, initialized at Layer Id 0
 * LayerSet[LayerIndex] = [CN_Index..., CN_Index..., CN_Index...]
 *
 * 3. Create a map from every remaining ACN that follows the form:
 * CNMap = [CN_Index, Next_CN_Index]
 * To populate this CNMap, we will "walk the floats" by looking at the correct neighbor float, and if it's correct corresponding ACN index is not yet in SearchSet, then we add as this map entries "Next CN Index". If the visited ACN is not in the SearchSet, it means that it's already been visited and assigned to the layer, so the algorithm must continue walking in the appropriate direction until it finds an ACN that is part of the Search Set. If it doesn't find one, mark the neighbor as NULL.
 *
 *
 * 4. Scan the CNMap list and look for any CNS that have "NULL" as they next value. Add those ACN to the LayerSet, and, remove them from the ValidACNs, and from the Map.
 *
 * 5. Create a set of all remaining ACN Indexes with ndx 1, call it "RightEdgeSet". Also initialize a list of groups, called LoopGroups, that will contain an array of objects including: the current ACN Index, a boolean flag for "valid", and a set of CN Indexes that are part of the "group".
 *
 * For each ACN in the RightEdgeSet, walk the neighbors 4 times (e.g. follow the "next" values in the CNMap 4 times) - (which equates to traversing to the right neighbor down, bottom neighbor left, left neighbor up, up neighbor right). Push the CN Index of each visited ACN to the group list assocated with this ACN's LoopGroup
 *
 * If the set ends at the same CN_Index where it began, then mark this LoopGroup as valid.
 *
 * 6. After creating LoopGroups for all ACNS in the RightEdgeSet, scan through the LoopGroups and, if marked "valid" add all the CNIndex's that are part of this objects "group" variable to the current LayerSet. Do not add duplicates to the LayerSet.
 *
 * 6. Remove any ACNs that were pushed to LayerSet from SearchSet, and repeat steps 2-6 until SearchSet is empty.
 *
 * 7. Return the LayerSet.
 *
 */

import { modStrict, wefts, type CNFloat, type CNIndex } from "adacad-drafting-lib";





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







/** Each entry is one layer: the list of contact indices assigned to that layer (order is not significant). */
export type LayerSet = Array<Array<CNIndex>>;

const cnKey = (n: CNIndex): string => `${n.i},${n.j},${n.id}`;

const parseKey = (key: string): CNIndex => {
    const [is, js, ids] = key.split(",");
    return { i: Number(is), j: Number(js), id: Number(ids) };
};

const normalizeNdx = (n: CNIndex, wefts: number, warps: number): CNIndex => ({
    i: modStrict(n.i, wefts),
    j: modStrict(n.j, warps),
    id: n.id,
});





const getNextCNInSearchSet = (ndx: CNIndex, floats: Array<CNFloat>, searchSet: Set<string>, wefts: number, warps: number): CNIndex | null => {


    if (ndx.id == 0 || ndx.id == 1) {
        let j_offset = (ndx.id == 0) ? -1 : 1;
        while (j_offset < warps - 1) {
            const j_adj = modStrict(ndx.j + j_offset, warps);
            const float = getWarpFloat(ndx.i, j_adj, wefts, warps, floats);
            if (float == null) return null;


            let acn = (ndx.id == 0) ? float.left : float.right;
            const acnNorm = normalizeNdx(acn, wefts, warps);
            const acnKey = cnKey(acnNorm);
            if (searchSet.has(acnKey)) {
                return acn;
            }
            j_offset++;
        }
        return null;
    }
    else if (ndx.id == 2 || ndx.id == 3) {
        let i_offset = (ndx.id == 2) ? -1 : 1;
        while (i_offset < wefts - 1) {
            const i_adj = modStrict(ndx.i + i_offset, wefts);
            const float = getWeftFloat(i_adj, ndx.j, wefts, warps, floats);
            if (float == null) return null;

            let acn = (ndx.id == 2) ? float.right : float.left;
            const acnNorm = normalizeNdx(acn, wefts, warps);
            const acnKey = cnKey(acnNorm);
            if (searchSet.has(acnKey)) {
                return acn;
            }
            i_offset++;
        }
        return null;
    }



}




const resolveNextInSearchSet = (
    start: CNIndex,
    searchSet: ReadonlySet<string>,
    wefts: number,
    warps: number,
): CNIndex | null => {
    const startNorm = normalizeNdx(start, wefts, warps);
    const startKey = cnKey(startNorm);
    let cur = stepLiftMapNext(startNorm, wefts, warps);
    const maxSteps = wefts * warps * 8;
    const visited = new Set<string>();

    for (let step = 0; step < maxSteps; step++) {
        const norm = normalizeNdx(cur, wefts, warps);
        const key = cnKey(norm);
        if (visited.has(key)) {
            return null;
        }
        visited.add(key);
        if (searchSet.has(key) && key !== startKey) {
            return norm;
        }
        cur = stepLiftMapNext(norm, wefts, warps);
    }
    return null;
};

const buildCnMap = (
    searchSet: ReadonlySet<string>,
    wefts: number,
    warps: number,
): Map<string, string | null> => {
    const map = new Map<string, string | null>();
    for (const key of searchSet) {
        const nxt = resolveNextInSearchSet(parseKey(key), searchSet, wefts, warps);
        map.set(key, nxt ? cnKey(nxt) : null);
    }
    return map;
};

/**
 * Builds layer groups from float endpoints using the lift-map walk described above.
 * @param floats - floats to analyze (typically all floats for the draft)
 * @param wefts - row count (simulation grid height)
 * @param warps - column count (simulation grid width)
 */
export const buildLiftMap = (floats: Array<CNFloat>, wefts: number, warps: number): LayerSet => {
    const layerSet: LayerSet = [];
    const searchSet = new Set<string>();

    for (const f of floats) {
        searchSet.add(cnKey(normalizeNdx(f.left, wefts, warps)));
        searchSet.add(cnKey(normalizeNdx(f.right, wefts, warps)));
    }

    const addToLayerUnique = (layer: CNIndex[], key: string, dedupe: Set<string>) => {
        const addOne = (k: string) => {
            if (dedupe.has(k)) {
                return;
            }
            dedupe.add(k);
            layer.push(parseKey(k));
        };
        addOne(key);
        const { i, j, id } = parseKey(key);
        const partnerKey = cnKey({ i, j, id: id ^ 1 });
        addOne(partnerKey);
    };

    while (searchSet.size > 0) {
        const layer: CNIndex[] = [];
        const dedupe = new Set<string>();

        let cnMap = buildCnMap(searchSet, wefts, warps);

        const nullKeys = [...searchSet].filter((k) => cnMap.get(k) === null);
        for (const k of nullKeys) {
            searchSet.delete(k);
            addToLayerUnique(layer, k, dedupe);
        }

        if (searchSet.size > 0) {
            cnMap = buildCnMap(searchSet, wefts, warps);
        }

        const rightEdgeKeys = [...searchSet].filter((k) => parseKey(k).id === 1);
        const consumedByLoop = new Set<string>();

        for (const startKey of rightEdgeKeys) {
            if (consumedByLoop.has(startKey)) {
                continue;
            }
            let cur = startKey;
            let valid = true;
            const chain: string[] = [];
            for (let s = 0; s < 4; s++) {
                const nxt = cnMap.get(cur);
                if (nxt === null || nxt === undefined) {
                    valid = false;
                    break;
                }
                chain.push(nxt);
                cur = nxt;
            }
            if (valid && cur === startKey) {
                const loopNodes = new Set<string>([startKey, ...chain]);
                for (const nk of loopNodes) {
                    consumedByLoop.add(nk);
                    addToLayerUnique(layer, nk, dedupe);
                }
            }
        }

        for (const k of dedupe) {
            searchSet.delete(k);
        }

        if (layer.length > 0) {
            layerSet.push(layer);
        }

        if (searchSet.size === 0) {
            break;
        }

        if (nullKeys.length === 0 && dedupe.size === 0) {
            const remainder: CNIndex[] = [];
            for (const k of searchSet) {
                remainder.push(parseKey(k));
            }
            layerSet.push(remainder);
            break;
        }
    }

    return layerSet;
};
