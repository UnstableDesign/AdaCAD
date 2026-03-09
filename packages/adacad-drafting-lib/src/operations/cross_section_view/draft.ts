// Draft generation from cross-section canvas state
interface DraftConfig {
    weftSystems: number;
}

// Optional hooks for observing rule activations during generate().
// Each method is called when the corresponding rule fires. Hooks are
// purely observational -- they do not influence algorithm behavior.
// When no hooks are provided, zero overhead is added.
export interface GenerateHooks {
    // Pick Identification (Phase 2)
    onR6a?: () => void;  // weft ID change
    onR6b?: () => void;  // explicit turn
    onR6c?: () => void;  // edge-mediated turn

    // Within-Pick Cell Computation (Phase 3, Part 1)
    onR3?: () => void;              // direct interaction applied
    onR5?: () => void;              // segment implied lift applied
    onR5CrossLayer?: () => void;    // segment crosses layers (transition point found)
    onR5BezierCrossing?: () => void; // same-layer opposite-type bezier crossing

    // Between-Pick Transition (Phase 3, Part 2)
    onR7?: () => void;   // weft system independence (skip)
    onR9b?: () => void;  // intervening warp virtual segment lift
}

export const createDraft = (config: DraftConfig) => {
    const weftSystems = config.weftSystems;

    const hasDirectInteractionInPick = (pickObject: any, targetWarpIdx: number): boolean => {
        if (!pickObject.interactions) return false;
        for (const interaction of pickObject.interactions) {
            if (interaction.warpIdx === targetWarpIdx) {
                return true;
            }
        }
        return false;
    };

    // Step 1: Flatten all interactions from the entity-centric warpAndEdgeData
    // into a single sorted list for the weft-centric draft algorithm.
    // Each interaction records: which weft, which warp, top/bottom, and what layer.
    const flattenInteractions = (currentCanvasState: any, currentNumWarps: number): Array<any> => {
        const allInteractions: Array<any> = [];

        if (currentCanvasState.warpAndEdgeData) {
            currentCanvasState.warpAndEdgeData.forEach((entity: any, entityIdx: number) => {
                if (entity.type === 'warp') {
                    // Process topWeft for warps
                    if (entity.topWeft) {
                        entity.topWeft.forEach((entry: any) => {
                            allInteractions.push({
                                weftId: entry.weft,
                                sequence: entry.sequence,
                                warpIdx: entityIdx - 1, // Left edge is at entityIdx 0, so first warp is at entityIdx 1
                                isTopInteraction: true,
                                warpLayer: entity.warpLayer ?? entity.warpSys
                            });
                        });
                    }
                    // Process bottomWeft for warps
                    if (entity.bottomWeft) {
                        entity.bottomWeft.forEach((entry: any) => {
                            allInteractions.push({
                                weftId: entry.weft,
                                sequence: entry.sequence,
                                warpIdx: entityIdx - 1, // Adjust entityIdx to be 0-indexed visual warp number
                                isTopInteraction: false,
                                warpLayer: entity.warpLayer ?? entity.warpSys
                            });
                        });
                    }
                } else if (entity.type === 'edge') {
                    // Process edge interactions from entity.edgeSys
                    const isLeftEdge = entityIdx === 0;
                    // entity.edgeSys is an array of arrays, outer indexed by systemLevel
                    entity.edgeSys.forEach((systemInteractions: any, systemLevel: number) => {
                        systemInteractions.forEach((entry: any) => {
                            allInteractions.push({
                                weftId: entry.weft,
                                sequence: entry.sequence,
                                warpIdx: isLeftEdge ? -1 : currentNumWarps,
                                isTopInteraction: false, // Always false for edge interactions
                                warpLayer: systemLevel // Layer depth clicked on the edge
                            });
                        });
                    });
                }
            });
        }

        return allInteractions;
    };

    const generate = (currentCanvasState: any, currentNumWarps: number, currentWarpSystems: number, hooks?: GenerateHooks): void => {

        currentCanvasState.generatedDraft = {
            rows: [],
            colSystemMapping: [],
            weftSystems
        };

        // Step 1: Create allInteractions List
        const allInteractions = flattenInteractions(currentCanvasState, currentNumWarps);

        // Step 2: Handle Empty Interactions
        if (allInteractions.length === 0) {
            currentCanvasState.generatedDraft.colSystemMapping = [];
            const numWarpsForBlank = currentNumWarps > 0 ? currentNumWarps : 1;
            const warpSysForBlank = currentWarpSystems > 0 ? currentWarpSystems : 1;
            // Read warpSys from warpAndEdgeData for warp system assignment
            const blankWarpEntities = currentCanvasState.warpAndEdgeData
                ? currentCanvasState.warpAndEdgeData.filter((e: any) => e.type === 'warp')
                : [];
            if (blankWarpEntities.length === numWarpsForBlank) {
                currentCanvasState.generatedDraft.colSystemMapping = blankWarpEntities.map((wd: any) => wd.warpSys);
            } else {
                for (let i = 0; i < numWarpsForBlank; i++) {
                    currentCanvasState.generatedDraft.colSystemMapping.push(i % warpSysForBlank);
                }
            }
            currentCanvasState.generatedDraft.rows.push({
                weftId: 0, // Default weftId
                cells: Array(numWarpsForBlank).fill(0) // All white cells
            });
            return;
        }

        // Step 3: Sort allInteractions by sequence to preserve drawing order.
        allInteractions.sort((a: any, b: any) => {
            return a.sequence - b.sequence;
        });

        // Step 4: Populate generatedDraft.colSystemMapping.
        currentCanvasState.generatedDraft.colSystemMapping = [];
        const warpEntities = currentCanvasState.warpAndEdgeData.filter((e: any) => e.type === 'warp');
        if (currentNumWarps > 0) {
            // Populate colSystemMapping based on the warp entities in warpAndEdgeData
            if (warpEntities.length === currentNumWarps) {
                currentCanvasState.generatedDraft.colSystemMapping = warpEntities.map((wd: any) => wd.warpSys);
            } else {
                // Fallback if warpAndEdgeData is not as expected or empty but numWarps > 0
                for (let i = 0; i < currentNumWarps; i++) {
                    currentCanvasState.generatedDraft.colSystemMapping.push(i % (currentWarpSystems > 0 ? currentWarpSystems : 1));
                }
            }
        } else {
            currentCanvasState.generatedDraft.colSystemMapping = [0]; // Default for 0 warps case
        }

        // Step 5: Identify picks (logical draft rows) from allInteractions.
        //
        // Each pick = one continuous weft traversal of the warp field (one draft row).
        // Three mechanisms detect pick boundaries: weft ID change, explicit turn,
        // and edge-mediated turn.
        const identifiedPicks: Array<any> = [];
        let currentPickInteractions: Array<any> = [];

        for (let i = 0; i < allInteractions.length; i++) {
            const currentInteraction = allInteractions[i];
            const prevInteractionGlobal = i > 0 ? allInteractions[i - 1] : null;
            let startNewPick = false;

            if (prevInteractionGlobal && currentInteraction.weftId !== prevInteractionGlobal.weftId) {
                startNewPick = true;
                hooks?.onR6a?.();
            } else if (prevInteractionGlobal &&
                currentInteraction.weftId === prevInteractionGlobal.weftId &&
                currentInteraction.warpIdx === prevInteractionGlobal.warpIdx && // Explicit Turn
                currentInteraction.isTopInteraction !== prevInteractionGlobal.isTopInteraction &&
                currentInteraction.sequence === prevInteractionGlobal.sequence + 1) { // Ensure it's the next click
                startNewPick = true;
                hooks?.onR6b?.();
            } else if (prevInteractionGlobal &&
                currentInteraction.weftId === prevInteractionGlobal.weftId &&
                // Edge-mediated turn: prev interaction is an edge, current is a valid warp,
                // and EITHER: (a) the pick already has non-edge warp interactions (typical
                // selvedge turn: warps -> edge -> return to warps), OR (b) the pick contains
                // both left and right edge interactions (edge-to-edge traversal: the weft
                // crossed the entire warp field without interacting, now starts a new pick).
                (prevInteractionGlobal.warpIdx === -1 || prevInteractionGlobal.warpIdx === currentNumWarps) &&
                currentInteraction.warpIdx >= 0 && currentInteraction.warpIdx < currentNumWarps &&
                (currentPickInteractions.some((int: any) => int.warpIdx >= 0 && int.warpIdx < currentNumWarps) ||
                 (currentPickInteractions.some((int: any) => int.warpIdx === -1) &&
                  currentPickInteractions.some((int: any) => int.warpIdx === currentNumWarps)))) {
                startNewPick = true;
                hooks?.onR6c?.();
            }

            if (startNewPick && currentPickInteractions.length > 0) {
                identifiedPicks.push({
                    weftId: currentPickInteractions[0].weftId,
                    interactions: [...currentPickInteractions]
                });
                currentPickInteractions = [];
            }
            currentPickInteractions.push(currentInteraction);
        }
        if (currentPickInteractions.length > 0) {
            identifiedPicks.push({
                weftId: currentPickInteractions[0].weftId,
                interactions: [...currentPickInteractions]
            });
        }

        // --- Step 6: Generate Draft Rows (Two-Part Logic) ---
        const processedRowsData: Array<any> = [];

        // == Part 1: Initial Row Processing (Direct Interactions & Segment-Based Travel Depth) ==
        if (currentCanvasState.warpAndEdgeData && currentCanvasState.warpAndEdgeData.length > 0 && currentNumWarps > 0) {
            identifiedPicks.forEach((pickDetails: any) => {
                const currentRowCells: Array<number> = Array(currentNumWarps).fill(0); // Initialize WHITE
                const pickInteractions = pickDetails.interactions;

                // A. Apply Direct Interactions first (Rule 3: Direct Interaction Priority)
                const directInteractionMapForPick = new Map<number, any>();
                if (pickInteractions.length > 0) {
                    pickInteractions.forEach((interaction: any) => {
                        // Only set cell state if the interaction is on an actual warp column
                        if (interaction.warpIdx >= 0 && interaction.warpIdx < currentNumWarps) {
                            currentRowCells[interaction.warpIdx] = interaction.isTopInteraction ? 0 : 1; // Cell state by direct click
                            hooks?.onR3?.();
                        }
                        directInteractionMapForPick.set(interaction.warpIdx, interaction);
                    });
                }

                // B. Apply Segment-Based Travel Depth Lifts (Rules 4 & 5)
                //
                // travelDepth = the effective layer depth the weft travels at within a segment.
                // When weft transitions between layers within a segment:
                // The weft transitions depth at the first intermediate warp of
                // the destination layer, scanning from A toward B.
                //   - At/before transition warp: travelDepth = srcLayer
                //   - Strictly after transition warp: travelDepth = destLayer
                // If same layer or no transition warp found: travelDepth = srcLayer throughout.
                if (pickInteractions.length >= 2) {
                    for (let i = 0; i < pickInteractions.length - 1; i++) {
                        const interactionA = pickInteractions[i];
                        const interactionB = pickInteractions[i + 1];

                        const srcLayer = interactionA.warpLayer;
                        const destLayer = interactionB.warpLayer;
                        const startWarpIdxExclusive = Math.min(interactionA.warpIdx, interactionB.warpIdx);
                        const endWarpIdxExclusive = Math.max(interactionA.warpIdx, interactionB.warpIdx);
                        const segDirection = Math.sign(interactionB.warpIdx - interactionA.warpIdx);

                        // Find transition point for any cross-layer segment
                        let transitionWarpIdx = -1;
                        if (destLayer !== srcLayer && segDirection !== 0) {
                            for (let w = interactionA.warpIdx + segDirection; w !== interactionB.warpIdx; w += segDirection) {
                                if (w >= 0 && w < currentNumWarps && (warpEntities[w]?.warpLayer ?? warpEntities[w]?.warpSys) === destLayer) {
                                    transitionWarpIdx = w;
                                    break;
                                }
                            }
                            if (transitionWarpIdx !== -1) {
                                hooks?.onR5CrossLayer?.();
                            }
                        }

                        // When descending (going to a deeper layer) with no
                        // intermediate destination-layer warp, the travel depth
                        // depends on whether the weft goes under at the source.
                        // Under (BTM): the weft must physically descend through
                        // intermediate layers to reach the destination, so
                        // travelDepth = destLayer for all intermediate cells.
                        // Over (TOP): the weft approaches from above and stays
                        // at the source depth -- intermediate warps don't lift.
                        const descendingNoTransition = transitionWarpIdx === -1
                            && destLayer > srcLayer
                            && !interactionA.isTopInteraction;

                        for (let cellWarpIdx = startWarpIdxExclusive + 1; cellWarpIdx < endWarpIdxExclusive; cellWarpIdx++) {
                            if (!directInteractionMapForPick.has(cellWarpIdx)) {
                                const warpLayerAtCell = warpEntities[cellWarpIdx]?.warpLayer ?? warpEntities[cellWarpIdx]?.warpSys ?? 0;

                                let travelDepth = srcLayer;
                                if (descendingNoTransition) {
                                    travelDepth = destLayer;
                                }
                                const strictlyPastTransition = transitionWarpIdx !== -1 && (segDirection > 0
                                    ? cellWarpIdx > transitionWarpIdx
                                    : cellWarpIdx < transitionWarpIdx);
                                if (strictlyPastTransition) {
                                    travelDepth = destLayer;
                                }

                                // Same-layer under/over: determines if the weft goes
                                // under warps at the same layer as the travel depth.
                                //
                                // Post-transition: use the layer transition direction --
                                // ascending (src deeper than dest) means the weft came
                                // from below and goes under; descending means it came
                                // from above and goes over.
                                //
                                // Pre-transition with same interaction type at both
                                // endpoints: uniform -- use the source endpoint's type.
                                //
                                // Pre-transition with opposite interaction types (one
                                // TOP, one BTM on the same layer): the bezier crosses
                                // from under to over (or vice versa) at the segment
                                // midpoint. Cells closer to the source follow the
                                // source's state; cells at or past the midpoint follow
                                // the destination's state. At the midpoint the weft is
                                // at the layer level (crossing point), so isUnder=false.
                                let isUnderAtCell: boolean;
                                if (strictlyPastTransition) {
                                    isUnderAtCell = srcLayer > destLayer;
                                } else if (srcLayer === destLayer &&
                                    interactionA.isTopInteraction !== interactionB.isTopInteraction) {
                                    hooks?.onR5BezierCrossing?.();
                                    const distFromA = Math.abs(cellWarpIdx - interactionA.warpIdx);
                                    const distFromB = Math.abs(cellWarpIdx - interactionB.warpIdx);
                                    if (distFromA < distFromB) {
                                        isUnderAtCell = !interactionA.isTopInteraction;
                                    } else if (distFromB < distFromA) {
                                        isUnderAtCell = !interactionB.isTopInteraction;
                                    } else {
                                        // At the midpoint: weft is at the layer level
                                        isUnderAtCell = false;
                                    }
                                } else {
                                    isUnderAtCell = !interactionA.isTopInteraction;
                                }

                                // Lift if weft travels deeper than this warp's layer or if at the same layer and going under
                                if (travelDepth > warpLayerAtCell ||
                                    (travelDepth === warpLayerAtCell && isUnderAtCell)) {
                                    currentRowCells[cellWarpIdx] = 1; // BLACK
                                    hooks?.onR5?.();
                                }
                            }
                        }
                    }
                }
                processedRowsData.push({ weftId: pickDetails.weftId, cells: currentRowCells, pickObj: pickDetails });
            });
        }

        // == Part 2: Inter-Pick Transition Lifts ==
        //
        // When a weft transitions from Pick N to Pick N+1, it must physically
        // travel from where it ended Pick N to where it starts Pick N+1. Any
        // warps it wraps around during this travel must be lifted.
        //
        // Same-warp turns require no processing -- the weft turns tightly
        // around the warp without extending past it.
        //
        // Cross-warp transitions (Rule 9): the weft travels to a different
        // warp, wrapping around intervening warps. Lifts go in the CURRENT
        // row (start of Pick N+1).

        if (processedRowsData.length > 1) { // Need at least two rows to compare
            for (let i = 1; i < processedRowsData.length; i++) { // Start from the second row
                const currentRowData = processedRowsData[i];
                const prevRowData = processedRowsData[i - 1];

                // Rule 7: Weft System Independence -- turn/transition logic only applies
                // between picks of the same weft system.
                if (currentRowData.weftId !== prevRowData.weftId) {
                    hooks?.onR7?.();
                    continue;
                }

                if (currentRowData.pickObj.interactions.length === 0 || prevRowData.pickObj.interactions.length === 0) {
                    continue;
                }

                const currentPickFirstInt = currentRowData.pickObj.interactions[0];
                const prevPickLastInt = prevRowData.pickObj.interactions[prevRowData.pickObj.interactions.length - 1];

                // Same-warp turns (Pick N+1 starts on the same warp as Pick N
                // ended, opposite interaction type) require no special processing
                // -- the weft turns tightly around the warp without extending past it.
                //
                // Cross-warp transitions: the weft travels from Pick N's endpoint
                // to Pick N+1's startpoint, wrapping around intervening warps.
                const isSameWarpTurn = currentPickFirstInt.warpIdx === prevPickLastInt.warpIdx &&
                    currentPickFirstInt.isTopInteraction !== prevPickLastInt.isTopInteraction &&
                    currentPickFirstInt.weftId === prevPickLastInt.weftId;

                if (!isSameWarpTurn) {
                    // Cross-Warp Transition (Rule 9): the transition from
                    // Pick N's endpoint to Pick N+1's startpoint is a virtual
                    // segment. Apply implied lift logic similar to Part 1, but
                    // with a different transition model: the weft transitions
                    // at the LAST destination-layer warp (closest to the
                    // destination), not the first. In Part 1 segments the weft
                    // actively interacts with the destination and transitions
                    // early. In virtual segments the weft is traveling freely
                    // between picks, staying at the source depth longer.
                    const transitionSrcLayer = prevPickLastInt.warpLayer;
                    const transitionDestLayer = currentPickFirstInt.warpLayer;
                    const minWarpIdx = Math.min(prevPickLastInt.warpIdx, currentPickFirstInt.warpIdx);
                    const maxWarpIdx = Math.max(prevPickLastInt.warpIdx, currentPickFirstInt.warpIdx);

                    // Direction from Pick N's endpoint to Pick N+1's startpoint
                    const transDir = Math.sign(currentPickFirstInt.warpIdx - prevPickLastInt.warpIdx);

                    // Find the LAST destination-layer warp scanning from source
                    // toward destination (closest to destination). The weft
                    // stays at source depth until this point.
                    let transitionVirtualIdx = -1;
                    if (transitionDestLayer !== transitionSrcLayer && transDir !== 0) {
                        for (let w = prevPickLastInt.warpIdx + transDir; w !== currentPickFirstInt.warpIdx; w += transDir) {
                            if (w >= 0 && w < currentNumWarps && (warpEntities[w]?.warpLayer ?? warpEntities[w]?.warpSys) === transitionDestLayer) {
                                transitionVirtualIdx = w; // keep scanning, don't break
                            }
                        }
                    }

                    for (let warpIdxInBetween = minWarpIdx + 1; warpIdxInBetween < maxWarpIdx; warpIdxInBetween++) {
                        if (!hasDirectInteractionInPick(currentRowData.pickObj, warpIdxInBetween)) {
                            const interveningWarpLayer = warpEntities[warpIdxInBetween]?.warpLayer ?? warpEntities[warpIdxInBetween]?.warpSys ?? 0;

                            const pastTransition = transitionVirtualIdx !== -1 && (transDir > 0
                                ? warpIdxInBetween > transitionVirtualIdx
                                : warpIdxInBetween < transitionVirtualIdx);

                            const virtualTravelDepth = pastTransition ? transitionDestLayer : transitionSrcLayer;
                            const virtualIsUnder = pastTransition
                                ? transitionSrcLayer > transitionDestLayer
                                : !prevPickLastInt.isTopInteraction;

                            if (virtualTravelDepth > interveningWarpLayer ||
                                (virtualTravelDepth === interveningWarpLayer && virtualIsUnder)) {
                                currentRowData.cells[warpIdxInBetween] = 1; // BLACK
                                hooks?.onR9b?.();
                            }
                        }
                    }
                }
            }
        }

        // Final Step: Build rows in display order (newest pick first) via unshift().
        // This matches AdaCAD's drawdown indexing where row 0 is the topmost visual row.
        processedRowsData.forEach((rowData: any) => {
            currentCanvasState.generatedDraft.rows.unshift({ weftId: rowData.weftId, cells: rowData.cells });
        });

    };

    return {
        generate,
    };
};
