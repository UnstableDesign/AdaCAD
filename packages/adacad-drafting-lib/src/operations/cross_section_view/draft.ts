// Draft Class - Handles draft generation from canvas state
interface DraftConfig {
    weftSystems: number;
    weftColors: string[];
}

export const createDraft = (config: DraftConfig) => {
    const weftSystems = config.weftSystems;
    const weftColors = config.weftColors;

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
                                warpLayer: entity.warpSys
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
                                warpLayer: entity.warpSys
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

    const generate = (currentCanvasState: any, currentNumWarps: number, currentWarpSystems: number): void => {

        currentCanvasState.generatedDraft = {
            rows: [],
            colSystemMapping: [],
            weftColors: weftColors.slice(0, weftSystems)
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
        // Trend detection uses "column position" (Math.floor(warpIdx / warpSystems))
        // rather than raw warpIdx. In multi-system layouts (e.g., s0,s1,s2,s0,s1,s2...),
        // warps from different systems at the same physical column are interleaved.
        // A weft crossing from W20(sys2) to W19(sys1) appears as a 1-warp backtrack
        // in raw indices, but both warps are in the same column — not a direction change.
        const identifiedPicks: Array<any> = [];
        let currentPickInteractions: Array<any> = [];
        let currentTrendInPick: 'increasing' | 'decreasing' | 'stationary' | 'none' = 'none';
        const effectiveWarpSystems = Math.max(currentWarpSystems, 1);
        const colPos = (warpIdx: number) => Math.floor(warpIdx / effectiveWarpSystems);

        for (let i = 0; i < allInteractions.length; i++) {
            const currentInteraction = allInteractions[i];
            const prevInteractionGlobal = i > 0 ? allInteractions[i - 1] : null;
            let startNewPick = false;

            if (prevInteractionGlobal && currentInteraction.weftId !== prevInteractionGlobal.weftId) {
                startNewPick = true;
            } else if (prevInteractionGlobal &&
                currentInteraction.weftId === prevInteractionGlobal.weftId &&
                currentInteraction.warpIdx === prevInteractionGlobal.warpIdx && // Explicit Turn
                currentInteraction.isTopInteraction !== prevInteractionGlobal.isTopInteraction &&
                currentInteraction.sequence === prevInteractionGlobal.sequence + 1) { // Ensure it's the next click
                startNewPick = true;
            } else if (prevInteractionGlobal &&
                currentInteraction.weftId === prevInteractionGlobal.weftId &&
                // Edge-mediated turn: prev interaction is an edge, current is a valid warp,
                // and EITHER: (a) the pick already has non-edge warp interactions (typical
                // selvedge turn: warps → edge → return to warps), OR (b) the pick contains
                // both left and right edge interactions (edge-to-edge traversal: the weft
                // crossed the entire warp field without interacting, now starts a new pick).
                (prevInteractionGlobal.warpIdx === -1 || prevInteractionGlobal.warpIdx === currentNumWarps) &&
                currentInteraction.warpIdx >= 0 && currentInteraction.warpIdx < currentNumWarps &&
                (currentPickInteractions.some((int: any) => int.warpIdx >= 0 && int.warpIdx < currentNumWarps) ||
                 (currentPickInteractions.some((int: any) => int.warpIdx === -1) &&
                  currentPickInteractions.some((int: any) => int.warpIdx === currentNumWarps)))) {
                startNewPick = true;
            } else if (currentPickInteractions.length > 0 &&
                prevInteractionGlobal &&
                currentInteraction.weftId === prevInteractionGlobal.weftId) { // Trend Reversal
                const lastInteractionInCurrentPick = currentPickInteractions[currentPickInteractions.length - 1];
                let newTrendSegment: 'increasing' | 'decreasing' | 'stationary' = 'stationary';

                const curCol = colPos(currentInteraction.warpIdx);
                const lastCol = colPos(lastInteractionInCurrentPick.warpIdx);
                if (curCol > lastCol) {
                    newTrendSegment = 'increasing';
                } else if (curCol < lastCol) {
                    newTrendSegment = 'decreasing';
                }

                const isCurrentInteractionAnEdge = currentInteraction.warpIdx === -1 || currentInteraction.warpIdx === currentNumWarps;

                if (currentPickInteractions.length === 1 && lastInteractionInCurrentPick.warpIdx !== currentInteraction.warpIdx) {
                    // First segment of a pick, establish initial trend
                    currentTrendInPick = newTrendSegment;
                } else if (!isCurrentInteractionAnEdge &&
                    currentTrendInPick !== 'none' &&
                    currentTrendInPick !== 'stationary' &&
                    newTrendSegment !== 'stationary' && // Don't break pick if new segment is stationary
                    currentTrendInPick !== newTrendSegment) {
                    startNewPick = true; // Trend reversed
                }
            }

            if (startNewPick && currentPickInteractions.length > 0) {
                identifiedPicks.push({
                    weftId: currentPickInteractions[0].weftId,
                    interactions: [...currentPickInteractions]
                });
                currentPickInteractions = [];
                currentTrendInPick = 'none';
            }
            currentPickInteractions.push(currentInteraction);

            // Update trend *after* pushing current interaction to currentPickInteractions
            // and *after* checking for startNewPick
            if (!startNewPick && currentPickInteractions.length > 1) {
                const lastInThisPick = currentPickInteractions[currentPickInteractions.length - 1];
                let trendAnchor = currentPickInteractions[0]; // Default anchor
                // Find the latest interaction in the current pick at a different column than the last one
                const lastColInPick = colPos(lastInThisPick.warpIdx);
                for (let k = currentPickInteractions.length - 2; k >= 0; k--) {
                    if (colPos(currentPickInteractions[k].warpIdx) !== lastColInPick) {
                        trendAnchor = currentPickInteractions[k];
                        break;
                    }
                }

                const anchorCol = colPos(trendAnchor.warpIdx);
                if (lastColInPick > anchorCol) {
                    currentTrendInPick = 'increasing';
                } else if (lastColInPick < anchorCol) {
                    currentTrendInPick = 'decreasing';
                } else {
                    currentTrendInPick = 'stationary';
                }
            } else if (!startNewPick && currentPickInteractions.length === 1) {
                currentTrendInPick = 'stationary';
            }
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
                const pickInteractions = pickDetails.interactions; // Already sorted by sequence

                // A. Apply Direct Interactions first (Rule 3: Direct Interaction Priority)
                const directInteractionMapForPick = new Map<number, any>();
                if (pickInteractions.length > 0) {
                    pickInteractions.forEach((interaction: any) => {
                        // Only set cell state if the interaction is on an actual warp column
                        if (interaction.warpIdx >= 0 && interaction.warpIdx < currentNumWarps) {
                            currentRowCells[interaction.warpIdx] = interaction.isTopInteraction ? 0 : 1; // Cell state by direct click
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

                        // Find transition point for any cross-layer segment
                        let transitionWarpIdx = -1;
                        if (destLayer !== srcLayer) {
                            const direction = Math.sign(interactionB.warpIdx - interactionA.warpIdx);
                            if (direction !== 0) {
                                for (let w = interactionA.warpIdx + direction; w !== interactionB.warpIdx; w += direction) {
                                    if (w >= 0 && w < currentNumWarps && warpEntities[w]?.warpSys === destLayer) {
                                        transitionWarpIdx = w;
                                        break;
                                    }
                                }
                            }
                        }

                        for (let cellWarpIdx = startWarpIdxExclusive + 1; cellWarpIdx < endWarpIdxExclusive; cellWarpIdx++) {
                            if (!directInteractionMapForPick.has(cellWarpIdx)) {
                                const warpLayerAtCell = warpEntities[cellWarpIdx]?.warpSys ?? 0;

                                let travelDepth = srcLayer;
                                const dir = Math.sign(interactionB.warpIdx - interactionA.warpIdx);
                                const strictlyPastTransition = transitionWarpIdx !== -1 && (dir > 0
                                    ? cellWarpIdx > transitionWarpIdx
                                    : cellWarpIdx < transitionWarpIdx);
                                if (strictlyPastTransition) {
                                    travelDepth = destLayer;
                                }

                                const isUnderAtCell = strictlyPastTransition
                                    ? !interactionB.isTopInteraction
                                    : !interactionA.isTopInteraction;

                                // Lift if weft travels deeper than this warp's layer or if at the same layer and going under
                                if (travelDepth > warpLayerAtCell ||
                                    (travelDepth === warpLayerAtCell && isUnderAtCell)) {
                                    currentRowCells[cellWarpIdx] = 1; // BLACK
                                }
                            }
                        }
                    }
                }
                processedRowsData.push({ weftId: pickDetails.weftId, cells: currentRowCells, pickObj: pickDetails });
            });
        }

        // == Part 2: Post-Processing for Turn/Transition Lifts ==

        if (processedRowsData.length > 1) { // Need at least two rows to compare
            for (let i = 1; i < processedRowsData.length; i++) { // Start from the second row
                const currentRowData = processedRowsData[i];
                const prevRowData = processedRowsData[i - 1];

                // Rule 7: Weft System Independence — turn/transition logic only applies
                // between picks of the same weft system. Different weft systems are
                // independent threads that don't interact.
                if (currentRowData.weftId !== prevRowData.weftId) {
                    continue;
                }

                if (currentRowData.pickObj.interactions.length === 0 || prevRowData.pickObj.interactions.length === 0) {
                    continue; // Both current and previous pick must have interactions
                }

                const currentPickFirstInt = currentRowData.pickObj.interactions[0];
                const prevPickLastInt = prevRowData.pickObj.interactions[prevRowData.pickObj.interactions.length - 1];

                let isSameWarpTurn = false;
                let turnContext: { turnWarpIdx: number, turnWarpLayer: number } | null = null;

                // A. Detect Same-Warp Turn condition (Rule 8)
                if (currentPickFirstInt.warpIdx === prevPickLastInt.warpIdx &&
                    currentPickFirstInt.isTopInteraction !== prevPickLastInt.isTopInteraction &&
                    currentPickFirstInt.weftId === prevPickLastInt.weftId) {
                    isSameWarpTurn = true;
                    turnContext = {
                        turnWarpIdx: currentPickFirstInt.warpIdx,
                        turnWarpLayer: currentPickFirstInt.warpLayer // Layer of the weft as it starts the new pick
                    };
                }

                if (isSameWarpTurn && turnContext) {
                    // Handle Specific Adjacent Warp — Directional Lift (Rule 8)
                    let adjacentWarpToPotentiallyLift: number | null = null;
                    if (prevRowData.pickObj.interactions.length >= 2) {
                        const prevPrevInteraction = prevRowData.pickObj.interactions[prevRowData.pickObj.interactions.length - 2];
                        const incomingSegmentOriginWarpIdx = prevPrevInteraction.warpIdx;

                        if (incomingSegmentOriginWarpIdx !== turnContext.turnWarpIdx) { // Ensure distinct point forming a segment
                            adjacentWarpToPotentiallyLift = turnContext.turnWarpIdx + Math.sign(turnContext.turnWarpIdx - incomingSegmentOriginWarpIdx);
                        }
                    }
                    // If prevRowData.pickObj.interactions.length < 2, no defined incoming direction,
                    // so no adjacent warp is lifted by this specific turn mechanism.

                    if (adjacentWarpToPotentiallyLift !== null && adjacentWarpToPotentiallyLift >= 0 && adjacentWarpToPotentiallyLift < currentNumWarps) {
                        const adjacentWarpLayer = warpEntities[adjacentWarpToPotentiallyLift]?.warpSys ?? 0;
                        if (adjacentWarpLayer < turnContext.turnWarpLayer) { // Adjacent warp is physically higher
                            // Only lift in PREVIOUS row (Pick N, the incoming leg).
                            // The adjacent warp is in the concavity of the turn, which the incoming
                            // pick wraps around. The outgoing pick (Pick N+1) moves away from the
                            // adjacent warp — if it later traverses that warp, Part 1 travel depth handles the lift.
                            if (!hasDirectInteractionInPick(prevRowData.pickObj, adjacentWarpToPotentiallyLift)) {
                                prevRowData.cells[adjacentWarpToPotentiallyLift] = 1; // BLACK
                            }
                        }
                    }
                } else {
                    // B. Handle Cross-Warp Transition (Rule 9)
                    // This applies when the new pick starts on a different warp than the previous pick ended.
                    const newPickStartLayer = currentPickFirstInt.warpLayer;

                    // 1. Lift Previous Pick End-Warp in Current Pick (Rule 9a)
                    // Lift if: (a) its physical layer is higher than the weft's new layer, OR
                    // (b) the weft was going UNDER the end warp (btm interaction). When the weft
                    // departs in a new direction, it's still under that warp and the warp must lift.
                    // Edge interactions also have isTopInteraction=false but are out-of-bounds,
                    // so the subsequent bounds check prevents spurious lifts.
                    const prevPickEndWarpLayer = warpEntities[prevPickLastInt.warpIdx]?.warpSys ?? 0;

                    if (prevPickEndWarpLayer < newPickStartLayer || !prevPickLastInt.isTopInteraction) {
                        // Only attempt to set cell if prevPickLastInt.warpIdx is a valid warp index
                        if (prevPickLastInt.warpIdx >= 0 && prevPickLastInt.warpIdx < currentNumWarps) {
                            if (!hasDirectInteractionInPick(currentRowData.pickObj, prevPickLastInt.warpIdx)) {
                                currentRowData.cells[prevPickLastInt.warpIdx] = 1; // BLACK
                            }
                        }
                    }

                    // 2. Lift Intervening Warps in Current Pick (Rule 9b)
                    // (If their physical layer is higher than the weft's new layer)
                    const minWarpIdx = Math.min(prevPickLastInt.warpIdx, currentPickFirstInt.warpIdx);
                    const maxWarpIdx = Math.max(prevPickLastInt.warpIdx, currentPickFirstInt.warpIdx);

                    for (let warpIdxInBetween = minWarpIdx + 1; warpIdxInBetween < maxWarpIdx; warpIdxInBetween++) { // Strictly between
                        const interveningWarpLayer = warpEntities[warpIdxInBetween]?.warpSys ?? 0;
                        if (interveningWarpLayer < newPickStartLayer) { // Intervening warp is physically higher
                            if (!hasDirectInteractionInPick(currentRowData.pickObj, warpIdxInBetween)) {
                                currentRowData.cells[warpIdxInBetween] = 1; // BLACK
                            }
                        }
                    }
                }

                // --- C. Retrospective Scoop Lift Logic (Rule 10, modifies prevRowData.cells) ---
                // Applied after A and B, using currentPickFirstInt as context for prevRowData interactions.
                const I_next_overall = currentPickFirstInt;
                if (prevRowData.pickObj.interactions.length >= 1) { // Minimum one point in prev pick to be I_current
                    // Iterate through all interactions in prevRowData to check if they form a scoop peak
                    // with I_next_overall as the clarifying point.
                    for (let k_idx = 0; k_idx < prevRowData.pickObj.interactions.length; k_idx++) {
                        const I_current = prevRowData.pickObj.interactions[k_idx];

                        if (I_current.isTopInteraction === true) {
                            if (k_idx > 0) { // I_current has a preceding interaction in its own pick
                                const I_prev_in_I_current_pick = prevRowData.pickObj.interactions[k_idx - 1];

                                const direction1 = Math.sign(I_current.warpIdx - I_prev_in_I_current_pick.warpIdx);
                                const direction2 = Math.sign(I_next_overall.warpIdx - I_current.warpIdx);

                                // Conditions for Retrospective Scoop Lift:
                                const cond_directional_reversal = (direction1 !== 0 && direction2 !== 0 && direction1 === -direction2);
                                const cond_peak_vs_incoming_layer = (I_current.warpLayer <= I_prev_in_I_current_pick.warpLayer);
                                const cond_peak_and_scoop_out_same_layer = (I_current.warpLayer === I_next_overall.warpLayer);
                                const cond_scoop_out_is_bottom = (I_next_overall.isTopInteraction === false);

                                if (cond_directional_reversal &&
                                    cond_peak_vs_incoming_layer &&
                                    cond_peak_and_scoop_out_same_layer &&
                                    cond_scoop_out_is_bottom
                                ) {
                                    prevRowData.cells[I_current.warpIdx] = 1; // BLACK
                                }
                            } else {
                                // I_current is the *first* interaction in prevRowData.
                                // A scoop here would need a point before it in the same pick
                                // to form the 3-point peak pattern. Not applicable if k_idx === 0.
                                // Cross-Warp Transition (Part B) or Same-Warp-Turn (Part A) handle
                                // the relationship with picks before prevRowData.
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
