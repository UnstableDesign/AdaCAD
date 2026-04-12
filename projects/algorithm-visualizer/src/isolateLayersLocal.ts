import {
    getFloatsAffectedByLifting,
    getLayer,
    getWarpFloatLength,
    getWeftFloatLength,
    isolateLayers,
    type CNFloat,
    type ContactNeighborhood,
    type SimulationVars,
} from "adacad-drafting-lib";
import { type FloatTraversalEvent } from "./traceTypes";

type FloatNode = { id: number; float: CNFloat; touched: boolean };

export interface LayerAlgorithmOptions {
    mode?: "global" | "scored_local";
    scoreRadiusScale?: number;
}

export interface IsolateLayersWithTraceResult {
    cns: Array<ContactNeighborhood>;
    trace: FloatTraversalEvent[];
    seedDebug: ScoredSeedDebugInfo[];
}

export interface ScoredSeedDebugInfo {
    floatId: number;
    score: number;
    radius: number;
    centerI: number;
    centerJ: number;
    processed: boolean;
    skippedAssigned: boolean;
}

const selectSeedFloatIndex = (floats: CNFloat[], wefts: number): number => {
    const longestWarp = floats.reduce(
        (acc, item, index) => {
            if (!item.face) {
                return acc;
            }

            const length = getWarpFloatLength(item, wefts) + 1;
            if (length >= acc.length) {
                return { length, index };
            }
            return acc;
        },
        { length: -1, index: -1 },
    );

    if (longestWarp.index !== -1) {
        return longestWarp.index;
    }

    // Fallback for structures with no warp-facing float in remaining set.
    return 0;
};

const floatLength = (value: CNFloat, wefts: number, warps: number): number =>
    value.face
        ? getWarpFloatLength(value, wefts) + 1
        : getWeftFloatLength(value, warps) + 1;

const endpointDistance = (
    a: { i: number; j: number },
    b: { i: number; j: number },
): number => Math.abs(a.i - b.i) + Math.abs(a.j - b.j);

const minSideDistance = (seed: CNFloat, value: CNFloat): number => {
    const seedEndpoints = [seed.left, seed.right];
    const valueEndpoints = [value.left, value.right];
    let minDistance = Number.POSITIVE_INFINITY;
    for (const s of seedEndpoints) {
        for (const v of valueEndpoints) {
            minDistance = Math.min(minDistance, endpointDistance(s, v));
        }
    }
    return minDistance;
};

const neighborLongestLength = (
    seed: CNFloat,
    pool: CNFloat[],
    wefts: number,
    warps: number,
): number => {

    const poolWithId = pool.map((item) => ({ id: item.id, float: item, touched: false }));

    const neighbors = getFloatsAffectedByLifting(
        seed.id,
        poolWithId,
        wefts,
        warps,
        1
    );

    const max = neighbors.reduce((acc, item) => {
        return Math.max(acc, floatLength(poolWithId[item].float, wefts, warps));
    }, 0);

    return max;
};

const getMaxAssignedLayer = (cns: ContactNeighborhood[]): number =>
    cns.reduce((acc, item) => Math.max(acc, item.layer), 0);

const buildScoredLocalTraceAndLayers = (
    wefts: number,
    warps: number,
    sourceFloats: CNFloat[],
    cns: ContactNeighborhood[],
    sim: SimulationVars,
    scoreRadiusScale: number,
): IsolateLayersWithTraceResult => {
    let workingCNs = cns;
    const trace: FloatTraversalEvent[] = [];
    const seedDebug: ScoredSeedDebugInfo[] = [];

    const scoredSeeds = sourceFloats.map((seed) => {
        const selfLength = floatLength(seed, wefts, warps);
        const neighborLength = neighborLongestLength(seed, sourceFloats, wefts, warps);
        const score = selfLength + neighborLength;
        return { seed, score };
    });

    scoredSeeds.sort((a, b) => b.score - a.score);

    for (const scored of scoredSeeds) {

        const radius = Math.max(1, Math.ceil(scored.score * scoreRadiusScale));
        const baseDebug = {
            floatId: scored.seed.id,
            score: scored.score,
            radius,
            centerI: scored.seed.left.i,
            centerJ: scored.seed.left.j,
        };

        if (getLayer(scored.seed.left, warps, workingCNs) !== 0) {
            seedDebug.push({
                ...baseDebug,
                processed: false,
                skippedAssigned: true,
            });
            continue;
        }

        const localFloats = sourceFloats
            .filter((item) => minSideDistance(scored.seed, item) <= radius);

        if (localFloats.length === 0) {
            seedDebug.push({
                ...baseDebug,
                processed: false,
                skippedAssigned: false,
            });
            continue;
        }

        seedDebug.push({
            ...baseDebug,
            processed: true,
            skippedAssigned: false,
        });

        const layerStart = getMaxAssignedLayer(workingCNs) + 1;
        trace.push({
            type: "local_region",
            layer: layerStart,
            seed_float_id: scored.seed.id,
            radius,
            float_ids: localFloats.map((item) => item.id),
        });
        trace.push({
            type: "seed_selected",
            layer: layerStart,
            float_id: scored.seed.id,
            float_face: scored.seed.face ? "warp" : "weft",
        });

        const localTrace = buildFloatTraversalTrace(
            wefts,
            warps,
            localFloats,
            layerStart,
            workingCNs,
            sim,
        );
        trace.push(...localTrace);



        workingCNs = isolateLayers(
            wefts,
            warps,
            localFloats,
            layerStart,
            workingCNs,
            sim,
        );
    }

    return { cns: workingCNs, trace, seedDebug };
};

export const buildFloatTraversalTrace = (
    wefts: number,
    warps: number,
    sourceFloats: CNFloat[],
    startLayer: number,
    cns: Array<ContactNeighborhood>,
    sim: SimulationVars,
): FloatTraversalEvent[] => {
    const trace: FloatTraversalEvent[] = [];
    let currentLayer = startLayer;
    let remainingFloats = sourceFloats
        .filter((item) => getLayer(item.left, warps, cns) === 0)
        .slice();

    while (remainingFloats.length > 0) {
        const nodes: FloatNode[] = remainingFloats.map((item, index) => ({
            id: index,
            float: item,
            touched: false,
        }));

        const seedIndex = selectSeedFloatIndex(remainingFloats, wefts);
        const seed = nodes[seedIndex];
        if (!seed) {
            break;
        }

        trace.push({
            type: "seed_selected",
            layer: currentLayer,
            float_id: seed.float.id,
            float_face: seed.float.face ? "warp" : "weft",
        });

        const liftFloat = (floatIndex: number) => {
            const floatObj = nodes[floatIndex];
            if (!floatObj || floatObj.touched) {
                return;
            }

            floatObj.touched = true;
            trace.push({
                type: "float_touched",
                layer: currentLayer,
                float_id: floatObj.float.id,
            });

            const attached = getFloatsAffectedByLifting(
                floatIndex,
                nodes,
                wefts,
                warps,
                sim.lift_limit * currentLayer,
            ).filter((id) => id !== -1);

            trace.push({
                type: "attached_discovered",
                layer: currentLayer,
                source_float_id: floatObj.float.id,
                attached_float_ids: attached
                    .map((id) => nodes[id]?.float.id)
                    .filter((id): id is number => id !== undefined),
            });

            for (const attachedIndex of attached) {
                liftFloat(attachedIndex);
            }
        };

        liftFloat(seedIndex);

        let assignedCount = 0;
        const untouched: CNFloat[] = [];
        for (const node of nodes) {
            if (node.touched) {
                assignedCount += 1;
                trace.push({
                    type: "layer_assigned",
                    layer: currentLayer,
                    float_id: node.float.id,
                });
            } else {
                untouched.push(node.float);
            }
        }

        trace.push({
            type: "layer_complete",
            layer: currentLayer,
            assigned_count: assignedCount,
            remaining_count: untouched.length,
        });

        remainingFloats = untouched;
        currentLayer += 1;
    }

    return trace;
};

export const isolateLayersLocal = (
    wefts: number,
    warps: number,
    floats: Array<CNFloat>,
    layer: number,
    cns: Array<ContactNeighborhood>,
    sim: SimulationVars,
    options: LayerAlgorithmOptions = {},
): IsolateLayersWithTraceResult => {
    if (options.mode === "scored_local") {
        return buildScoredLocalTraceAndLayers(
            wefts,
            warps,
            floats,
            cns,
            sim,
            options.scoreRadiusScale ?? 1,
        );
    }

    const trace = buildFloatTraversalTrace(wefts, warps, floats, layer, cns, sim);
    const layered = isolateLayers(wefts, warps, floats, layer, cns, sim);

    return {
        cns: layered,
        trace,
        seedDebug: [],
    };
};