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

import { modStrict, type CNFloat, type CNIndex } from "adacad-drafting-lib";
import { simVars } from "./simVars";
import { type LiftMapTraceEvent } from "./traceTypes";






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


const samePoint = (a: CNIndex, b: CNIndex): boolean => a.i == b.i && a.j == b.j;


const onRay = (start: CNIndex, lastLift: CNIndex, end: CNIndex, threshold: number): boolean => {
    if (start.id == 1 || start.id == 0) {


        //check if it's in line with the last warp lift
        if (lastLift.j == start.j) {
            if (Math.abs(start.i - lastLift.i) < threshold) return true;
        }

        //check if it's in line with the last weft lift
        if (end.i == start.i) {
            if (Math.abs(start.j - end.j) < threshold) return true;
        }
    }

    if (start.id == 2 || start.id == 3) {
        if (lastLift.i == start.i) {
            if (Math.abs(start.j - lastLift.j) < threshold) return true;
        }

        if (end.j == start.j) {
            if (Math.abs(start.i - end.i) < threshold) return true;
        }
    }

    return false;

}
/**
 * checks the starting point, ending point, and last visited warp to see if you can
 * draw a ray from the last warp to this weft (even if it didn't end on the same point)
 * this handles a case such as basket, where the weft would have lifted but is 
 * eseentially "blocked" by separate weft along the loop
 * @param startKey 
 * @param chain 
 * @returns 
 */
const ValidLoop = (startKey: string, chain: string[], threshold: number): boolean => {


    console.log("START KEY IS", startKey);

    const start = parseKey(startKey);
    const end = parseKey(chain[chain.length - 1]);
    const lastLift = parseKey(chain[chain.length - 2]);

    if (samePoint(start, end)) return true;
    else if (onRay(start, lastLift, end, threshold)) return true;
    else return false;


}


type NextInSearchSet = { acn: CNIndex; floatId: number };

const getNextCNInSearchSet = (
    ndx: CNIndex,
    floats: Array<CNFloat>,
    searchSet: ReadonlySet<string>,
    wefts: number,
    warps: number,
): NextInSearchSet | null => {
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
                return { acn: acnNorm, floatId: float.id };
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
                return { acn: acnNorm, floatId: float.id };
            }
            i_offset++;
        }
        return null;
    }

    return null;
}


const edgeStepKey = (fromKey: string, toKey: string): string => `${fromKey}|${toKey}`;

const buildCnMapWithEdgeFloats = (
    searchSet: ReadonlySet<string>,
    floats: Array<CNFloat>,
    wefts: number,
    warps: number,
): { cnMap: Map<string, string | null>; stepFloatId: Map<string, number> } => {
    const cnMap = new Map<string, string | null>();
    const stepFloatId = new Map<string, number>();
    for (const key of searchSet) {
        const nxt = getNextCNInSearchSet(parseKey(key), floats, searchSet, wefts, warps);
        if (!nxt) {
            cnMap.set(key, null);
        } else {
            const toKey = cnKey(nxt.acn);
            cnMap.set(key, toKey);
            stepFloatId.set(edgeStepKey(key, toKey), nxt.floatId);
        }
    }
    return { cnMap, stepFloatId };
};

export interface LiftMapBuildResult {
    layerSet: LayerSet;
    trace: LiftMapTraceEvent[];
}

/**
 * Builds layer groups from float endpoints using the lift-map walk described above.
 * Emits a step trace for visualization (see `LiftMapTraceEvent`).
 */
export const buildLiftMapWithTrace = (
    floats: Array<CNFloat>,
    wefts: number,
    warps: number,
): LiftMapBuildResult => {
    const trace: LiftMapTraceEvent[] = [];
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
    };

    while (searchSet.size > 0) {
        const layerIndex = layerSet.length;
        trace.push({ type: "layer_begin", layer_index: layerIndex });

        const layer: CNIndex[] = [];
        const dedupe = new Set<string>();

        let { cnMap, stepFloatId } = buildCnMapWithEdgeFloats(searchSet, floats, wefts, warps);

        const nullKeys = [...searchSet].filter((k) => cnMap.get(k) === null);
        for (const k of nullKeys) {
            trace.push({ type: "null_candidate", acn_key: k });
            searchSet.delete(k);
            const lenBefore = layer.length;
            addToLayerUnique(layer, k, dedupe);
            if (layer.length > lenBefore) {
                trace.push({ type: "add_acn_layer", acn_key: k, layer_index: layerIndex, reason: "null_next" });
            }
        }

        if (searchSet.size > 0) {
            const rebuilt = buildCnMapWithEdgeFloats(searchSet, floats, wefts, warps);
            cnMap = rebuilt.cnMap;
            stepFloatId = rebuilt.stepFloatId;
        }

        const consumedByLoop = new Set<string>();

        for (const startKey of [...searchSet]) {
            if (consumedByLoop.has(startKey)) {
                continue;
            }
            trace.push({ type: "loop_seed", acn_key: startKey });
            let cur = startKey;
            let valid = true;
            const chain: string[] = [];
            for (let s = 0; s < 4; s++) {
                const nxt = cnMap.get(cur);
                if (nxt === null || nxt === undefined) {
                    valid = false;
                    trace.push({ type: "loop_outcome", start_key: startKey, valid: false });
                    break;
                }
                const fid = stepFloatId.get(edgeStepKey(cur, nxt)) ?? null;
                trace.push({
                    type: "loop_step",
                    acn_key_from: cur,
                    acn_key_to: nxt,
                    step_index: s,
                    float_id: fid,
                });
                chain.push(nxt);
                cur = nxt;
            }

            if (valid) {
                const vl = ValidLoop(
                    startKey,
                    chain,
                    (simVars as { neighbor_lift_threshold?: number }).neighbor_lift_threshold ?? 10,
                );
                trace.push({ type: "loop_outcome", start_key: startKey, valid: vl });
                if (vl) {
                    const loopNodes = new Set<string>([startKey, ...chain]);
                    for (const nk of loopNodes) {
                        consumedByLoop.add(nk);
                        const lenBefore = layer.length;
                        addToLayerUnique(layer, nk, dedupe);
                        if (layer.length > lenBefore) {
                            trace.push({ type: "add_acn_layer", acn_key: nk, layer_index: layerIndex, reason: "loop" });
                        }
                    }
                }
            }
        }


        for (const k of dedupe) {
            searchSet.delete(k);
        }

        trace.push({ type: "layer_end", layer_index: layerIndex });

        if (layer.length > 0) {
            layerSet.push(layer);
        }

        if (searchSet.size === 0) {
            break;
        }

        if (nullKeys.length === 0 && dedupe.size === 0) {
            const remainderKeys = [...searchSet];
            trace.push({
                type: "terminate_remainder",
                acn_keys: remainderKeys,
                layer_index: layerSet.length,
            });
            const remainder: CNIndex[] = remainderKeys.map((k) => parseKey(k));
            layerSet.push(remainder);
            break;
        }
    }

    return { layerSet, trace };
};

/**
 * Builds layer groups from float endpoints using the lift-map walk described above.
 * @param floats - floats to analyze (typically all floats for the draft)
 * @param wefts - row count (simulation grid height)
 * @param warps - column count (simulation grid width)
 */
export const buildLiftMap = (floats: Array<CNFloat>, wefts: number, warps: number): LayerSet =>
    buildLiftMapWithTrace(floats, wefts, warps).layerSet;
