// P5 Canvas Sketch for Cross-Section View Operation
import { createDraft } from './draft';
import { createBezierCurve } from './bezier_curve';
import { DEFAULT_WARP_DOT_COLOR, DEFAULT_WARP_DOT_SIZE } from './defaults';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 450;

interface CrossSectionViewSketchConfig {
    warpSystems: number;
    weftSystems: number;
    numWarps: number;
    hasSeedDraft: boolean;
    weftColors: string[];
    weftMaterialIds: number[];
    warpColors: string[];
    weftStrokeWeights: number[];
    warpDotSizes: number[];
    seedColSystemMapping?: number[];
    canvasState: any;
    updateCallback: Function;
    loadCanvasState: Function;
}

export const createP5Sketch = (config: CrossSectionViewSketchConfig) => {
    const warpSystems = config.warpSystems;
    const weftSystems = config.weftSystems;
    const numWarps = config.numWarps;
    const hasSeedDraft = config.hasSeedDraft;
    const weftColors = config.weftColors;
    const weftMaterialIds = config.weftMaterialIds;
    const warpColors = config.warpColors;
    const weftStrokeWeights = config.weftStrokeWeights;
    const warpDotSizes = config.warpDotSizes;
    const seedColSystemMapping = config.seedColSystemMapping;
    const updateCallback = config.updateCallback;
    const loadCanvasState = config.loadCanvasState;

    return (p: any) => {
        let effectiveWarpSystems = warpSystems;
        let effectiveWeftSystems = weftSystems;
        let effectiveNumWarps = numWarps;

        let activeWarpSystems = Math.min(effectiveNumWarps, effectiveWarpSystems);

        // -- Constants
        const SKETCH_CANVAS_WIDTH = CANVAS_WIDTH;
        const SKETCH_CANVAS_HEIGHT = CANVAS_HEIGHT;
        const SKETCH_TOP_MARGIN = 60;
        const SKETCH_LEFT_MARGIN = 100;
        const SKETCH_RIGHT_MARGIN = 60;
        const SKETCH_BOTTOM_MARGIN = 20;
        const WEFT_ICON_SIZE = 36;
        const WEFT_ICON_FONT_SIZE = 24;
        const WEFT_DOT_SIZE = 16;
        const WEFT_SPACING = 24;
        const TILE_DOT_OFFSET = WEFT_DOT_SIZE + 2;
        const TILE_TOGGLE_DURATION = 150; // hover preview animation duration (ms)
        const TILE_GHOST_OPACITY = 130;
        const RESET_BUTTON = { x: 30, y: 15, w: 82, h: 28 };

        // Control limits
        const MAX_WARP_SYSTEMS = 10;
        const MAX_WEFT_SYSTEMS = 10;
        const MAX_WARPS = 24;
        const MIN_WARPS = 1;
        const MIN_WARP_SYSTEMS = 1;
        const MIN_WEFT_SYSTEMS = 1;

        const BADGE_CENTER_Y = 45;
        const BADGE_BASE_W = 24;
        const BADGE_BASE_H = 20;
        const BADGE_FONT_SIZE = 12;
        const BADGE_MIN_W = 18;
        const BADGE_MIN_H = 15;
        const BADGE_MIN_FONT = 9;

        const DEFAULT_CANVAS_STATE = {
            weftDots: [],
            selectedDots: [],
            dotFills: [],
            activeWeft: null,
            pathsByWeft: {},
            warpAndEdgeData: [],
            clickSequence: 0,
            hoveredDotIndex: -1,
            showDeleteButton: false,
            deleteButtonBounds: null,
            manualWarpSystems: warpSystems,
            manualWeftSystems: weftSystems,
            manualNumWarps: numWarps,
            builtForWarpSystems: warpSystems,
            builtForWeftSystems: weftSystems,
            generatedDraft: {
                rows: [],
                colSystemMapping: [],
                weftSystems: 0
            }
        };

        // Canvas State
        let { canvasState, needsReset } = loadCanvasState(DEFAULT_CANVAS_STATE);

        // Tile-mode state
        let tileHoverAnim: { dotIndex: number, startTime: number, fromTile: boolean } | null = null;
        let provisionalFill: { dotIndex: number, weftId: number, subDot: 'top' | 'bottom' } | null = null;

        // Track wefts that have had dots deleted in the current session.
        // When adding new dots for an "edited" weft, the interaction is inserted
        // after the weft's existing interactions (preserving row position in the draft)
        // rather than appended at the end of the global sequence (which would create
        // an unwanted extra row).
        const editedWeftIds = new Set<number>();

        // Hover state for warp system badges
        let hoveredBadgeWarp = -1;

        // Initialize helper classes
        let draftGenerator = createDraft({ weftSystems: effectiveWeftSystems });
        let bezierRenderer = createBezierCurve({ p, weftColors, weftStrokeWeights });


        // ── Shared Helpers ──────────────────────────────────────────

        // Generate draft and stamp material IDs
        function generateDraft() {
            draftGenerator.generate(canvasState, effectiveNumWarps, activeWarpSystems);
            if (canvasState.generatedDraft) {
                canvasState.generatedDraft.resolvedSketchMaterialIds = weftMaterialIds;
            }
        }

        // Single source of truth for dot layout. Returns positions in order:
        function computeWeftDotPositions(): Array<{x: number, y: number}> {
            const numColumns = effectiveNumWarps + 2;
            const firstColumnX = SKETCH_LEFT_MARGIN;
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const drawingWidth = lastColumnX - firstColumnX;
            const spacingX = numColumns > 1 ? drawingWidth / (numColumns - 1) : 0;
            const spacingY = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (activeWarpSystems + 1);

            const dots: Array<{x: number, y: number}> = [];

            // Left edge dots
            for (let sys = 0; sys < activeWarpSystems; sys++) {
                dots.push({ x: firstColumnX, y: SKETCH_TOP_MARGIN + spacingY * (sys + 1) });
            }

            // Warp dots (top then bottom for each warp)
            for (let i = 0; i < effectiveNumWarps; i++) {
                const x = firstColumnX + spacingX * (i + 1);
                const warpEntityData = canvasState.warpAndEdgeData[i + 1];
                const warpLayer = ((warpEntityData.warpLayer ?? warpEntityData.warpSys) % activeWarpSystems);
                const warpCenterY = SKETCH_TOP_MARGIN + spacingY * (warpLayer + 1);
                dots.push({ x, y: warpCenterY - WEFT_SPACING }); // top
                dots.push({ x, y: warpCenterY + WEFT_SPACING }); // bottom
            }

            // Right edge dots
            const rightX = numColumns > 1 ? lastColumnX : firstColumnX;
            for (let sys = 0; sys < activeWarpSystems; sys++) {
                dots.push({ x: rightX, y: SKETCH_TOP_MARGIN + spacingY * (sys + 1) });
            }

            return dots;
        }

        // Reverse mapping: entity position -> dot index (inverse of getDotInfo)
        function getDotIdx(entityIdx: number, posType: string, warpSysId?: number): number {
            if (entityIdx === 0) {
                // Left edge
                return warpSysId!;
            } else if (entityIdx === effectiveNumWarps + 1) {
                // Right edge
                return activeWarpSystems + (effectiveNumWarps * 2) + warpSysId!;
            } else {
                // Warp
                return activeWarpSystems + ((entityIdx - 1) * 2) + (posType === 'bottomWeft' ? 1 : 0);
            }
        }

        // Check if a dot index corresponds to a tile-mode edge dot
        function isEdgeDotInTileMode(dotIndex: number): boolean {
            const info = getDotInfo(dotIndex);
            if (info.posType !== 'edgeSys') return false;
            const entity = canvasState.warpAndEdgeData[info.idx];
            return entity && entity.tileMode && entity.tileMode[info.warpSysId!];
        }

        // Unified hit detection for both loop-mode and tile-mode dots.
        // Returns which dot was hit and, for tile-mode, which sub-dot (top/bottom).
        function findHitDot(mx: number, my: number): { dotIndex: number, subDot?: 'top' | 'bottom' } | null {
            for (let i = 0; i < canvasState.weftDots.length; i++) {
                const dot = canvasState.weftDots[i];
                if (isEdgeDotInTileMode(i)) {
                    const topY = dot.y - TILE_DOT_OFFSET;
                    const bottomY = dot.y + TILE_DOT_OFFSET;
                    const distTop = p.dist(mx, my, dot.x, topY);
                    const distBottom = p.dist(mx, my, dot.x, bottomY);
                    if (distTop < WEFT_DOT_SIZE || distBottom < WEFT_DOT_SIZE) {
                        const subDot: 'top' | 'bottom' = distTop <= distBottom ? 'top' : 'bottom';
                        return { dotIndex: i, subDot };
                    }
                } else {
                    if (p.dist(mx, my, dot.x, dot.y) < WEFT_DOT_SIZE) {
                        return { dotIndex: i };
                    }
                }
            }
            return null;
        }

        // ── Render Cache ────────────────────────────────────────────

        // Derives all visual state from warpAndEdgeData (single source of truth)
        // Called after every data mutation: dot click, delete, reset
        function rebuildRenderCache(): void {
            // 1. Compute dot positions
            canvasState.weftDots = computeWeftDotPositions();

            // 2. Initialize dotFills with empty arrays
            const totalDots = (activeWarpSystems * 2) + (effectiveNumWarps * 2);
            canvasState.dotFills = [];
            for (let i = 0; i < totalDots; i++) {
                canvasState.dotFills.push([]);
            }

            // 3. Walk warpAndEdgeData -> populate dotFills and collect interactions for path building
            const allInteractions: Array<{weftId: number, sequence: number, dotIdx: number, subDot?: 'top' | 'bottom'}> = [];

            for (let entityIdx = 0; entityIdx < canvasState.warpAndEdgeData.length; entityIdx++) {
                const entity = canvasState.warpAndEdgeData[entityIdx];

                if (entity.type === 'edge') {
                    for (let sysLevel = 0; sysLevel < entity.edgeSys.length; sysLevel++) {
                        const dotIdx = getDotIdx(entityIdx, 'edgeSys', sysLevel);
                        for (const interaction of entity.edgeSys[sysLevel]) {
                            canvasState.dotFills[dotIdx].push(interaction.weft);
                            allInteractions.push({
                                weftId: interaction.weft,
                                sequence: interaction.sequence,
                                dotIdx,
                                subDot: interaction.subDot
                            });
                        }
                    }
                } else if (entity.type === 'warp') {
                    const topDotIdx = getDotIdx(entityIdx, 'topWeft');
                    for (const interaction of entity.topWeft) {
                        canvasState.dotFills[topDotIdx].push(interaction.weft);
                        allInteractions.push({
                            weftId: interaction.weft,
                            sequence: interaction.sequence,
                            dotIdx: topDotIdx
                        });
                    }

                    const bottomDotIdx = getDotIdx(entityIdx, 'bottomWeft');
                    for (const interaction of entity.bottomWeft) {
                        canvasState.dotFills[bottomDotIdx].push(interaction.weft);
                        allInteractions.push({
                            weftId: interaction.weft,
                            sequence: interaction.sequence,
                            dotIdx: bottomDotIdx
                        });
                    }
                }
            }

            // 3b. Build tileDotFills for tile-mode edge dots
            canvasState.tileDotFills = {} as Record<number, {top: number[], bottom: number[]}>;
            for (let entityIdx = 0; entityIdx < canvasState.warpAndEdgeData.length; entityIdx++) {
                const entity = canvasState.warpAndEdgeData[entityIdx];
                if (entity.type === 'edge') {
                    for (let sysLevel = 0; sysLevel < entity.edgeSys.length; sysLevel++) {
                        if (entity.tileMode && entity.tileMode[sysLevel]) {
                            const dotIdx = getDotIdx(entityIdx, 'edgeSys', sysLevel);
                            const topFills: number[] = [];
                            const bottomFills: number[] = [];
                            for (const interaction of entity.edgeSys[sysLevel]) {
                                if (interaction.subDot === 'top') {
                                    topFills.push(interaction.weft);
                                } else if (interaction.subDot === 'bottom') {
                                    bottomFills.push(interaction.weft);
                                }
                            }
                            canvasState.tileDotFills[dotIdx] = { top: topFills, bottom: bottomFills };
                        }
                    }
                }
            }

            // 4. Derive selectedDots (any dot with non-empty fills)
            canvasState.selectedDots = [];
            for (let i = 0; i < canvasState.dotFills.length; i++) {
                if (canvasState.dotFills[i].length > 0) {
                    canvasState.selectedDots.push(i);
                }
            }

            // 5. Group interactions by weftId, sorted by sequence
            const interactionsByWeft: Record<number, Array<{sequence: number, dotIdx: number, subDot?: 'top' | 'bottom'}>> = {};
            for (const interaction of allInteractions) {
                if (!interactionsByWeft[interaction.weftId]) {
                    interactionsByWeft[interaction.weftId] = [];
                }
                interactionsByWeft[interaction.weftId].push({
                    sequence: interaction.sequence,
                    dotIdx: interaction.dotIdx,
                    subDot: interaction.subDot
                });
            }
            for (const weftId in interactionsByWeft) {
                interactionsByWeft[weftId].sort((a, b) => a.sequence - b.sequence);
            }

            // 6. Build pathsByWeft: create anchors, split into sub-paths at tile-mode edges
            canvasState.pathsByWeft = {};
            for (const weftIdStr in interactionsByWeft) {
                const weftId = parseInt(weftIdStr, 10);
                const sortedInteractions = interactionsByWeft[weftId];

                // Build flat anchor list
                const allAnchors: any[] = [];
                for (const interaction of sortedInteractions) {
                    const dotPos = canvasState.weftDots[interaction.dotIdx];
                    // Skip consecutive same-dotIdx (dedup)
                    if (allAnchors.length === 0 || allAnchors[allAnchors.length - 1].dotIdx !== interaction.dotIdx) {
                        allAnchors.push({
                            id: generateUUID(),
                            dotIdx: interaction.dotIdx,
                            pos: { x: dotPos.x, y: dotPos.y },
                            cpBefore: { x: dotPos.x, y: dotPos.y },
                            cpAfter: { x: dotPos.x, y: dotPos.y },
                            subDot: interaction.subDot,
                            isTileModeEdge: isEdgeDotInTileMode(interaction.dotIdx)
                        });
                    }
                }

                // Split into sub-paths at tile-mode edge anchors (middle anchors only)
                const subPaths: any[][] = [];
                let currentSubPath: any[] = [];

                for (let i = 0; i < allAnchors.length; i++) {
                    const anchor = allAnchors[i];
                    currentSubPath.push(anchor);

                    // Split at tile-mode edge anchors that are in the middle of the path
                    if (anchor.isTileModeEdge && i > 0 && i < allAnchors.length - 1) {
                        subPaths.push(currentSubPath);
                        // Start new sub-path with departure copy of this anchor (opposite subDot)
                        const departureAnchor = {
                            ...anchor,
                            id: generateUUID(),
                            pos: { ...anchor.pos },
                            cpBefore: { ...anchor.pos },
                            cpAfter: { ...anchor.pos },
                            subDot: anchor.subDot === 'top' ? 'bottom' : anchor.subDot === 'bottom' ? 'top' : undefined
                        };
                        currentSubPath = [departureAnchor];
                    }
                }
                if (currentSubPath.length > 0) {
                    subPaths.push(currentSubPath);
                }

                // Calculate Bezier control points for each sub-path
                for (const sp of subPaths) {
                    if (sp.length >= 2) {
                        bezierRenderer.calculateBezierControlPoints(sp);
                    }
                }

                canvasState.pathsByWeft[weftId] = subPaths;
            }

            // 7. Generate draft
            generateDraft();
        }


        // ── Canvas Lifecycle ────────────────────────────────────────

        function resetCanvas() {
            editedWeftIds.clear();

            const savedManualWarpSystems = canvasState.manualWarpSystems ?? effectiveWarpSystems;
            const savedManualWeftSystems = canvasState.manualWeftSystems ?? effectiveWeftSystems;
            const savedManualNumWarps = canvasState.manualNumWarps ?? effectiveNumWarps;

            // Update effective values from manual state
            if (!hasSeedDraft) {
                effectiveWarpSystems = savedManualWarpSystems;
                effectiveWeftSystems = savedManualWeftSystems;
            }
            effectiveNumWarps = savedManualNumWarps;
            activeWarpSystems = Math.min(effectiveNumWarps, effectiveWarpSystems);

            // Recreate helper classes with current config
            draftGenerator = createDraft({ weftSystems: effectiveWeftSystems });
            bezierRenderer = createBezierCurve({ p, weftColors, weftStrokeWeights });

            canvasState = JSON.parse(JSON.stringify(DEFAULT_CANVAS_STATE));

            // Restore manual values (DEFAULT_CANVAS_STATE has initial config values)
            canvasState.manualWarpSystems = savedManualWarpSystems;
            canvasState.manualWeftSystems = savedManualWeftSystems;
            canvasState.manualNumWarps = savedManualNumWarps;

            // Left Edge Entity (index 0)
            const leftEdgeEntity: { type: string, edgeSys: any[][], tileMode: boolean[] } = {
                type: 'edge', edgeSys: [], tileMode: new Array(activeWarpSystems).fill(false)
            };
            for (let i = 0; i < activeWarpSystems; i++) {
                leftEdgeEntity.edgeSys.push([]);
            }
            canvasState.warpAndEdgeData.push(leftEdgeEntity);

            // Warp Entities (indices 1 to effectiveNumWarps)
            // Use seed draft's colSystemMapping when available; fall back to round-robin
            for (let i = 0; i < effectiveNumWarps; i++) {
                const warpSys = seedColSystemMapping
                    ? seedColSystemMapping[i % seedColSystemMapping.length]
                    : (i % activeWarpSystems);
                canvasState.warpAndEdgeData.push({
                    type: 'warp',
                    warpSys,
                    warpLayer: warpSys,
                    topWeft: [],
                    bottomWeft: []
                });
            }

            // Right Edge Entity (index effectiveNumWarps + 1)
            const rightEdgeEntity: { type: string, edgeSys: any[][], tileMode: boolean[] } = {
                type: 'edge', edgeSys: [], tileMode: new Array(activeWarpSystems).fill(false)
            };
            for (let i = 0; i < activeWarpSystems; i++) {
                rightEdgeEntity.edgeSys.push([]);
            }
            canvasState.warpAndEdgeData.push(rightEdgeEntity);

            rebuildRenderCache();

            canvasState.builtForWarpSystems = effectiveWarpSystems;
            canvasState.builtForWeftSystems = effectiveWeftSystems;

            // Report the new canvasState to the operation
            updateCallback(canvasState);
            p.redraw();
        }

        // Clear only weft spline data, preserving warp structure and system assignments
        function resetWeftSplines() {
            editedWeftIds.clear();

            for (const entity of canvasState.warpAndEdgeData) {
                if (entity.type === 'warp') {
                    entity.topWeft = [];
                    entity.bottomWeft = [];
                } else if (entity.type === 'edge') {
                    for (let i = 0; i < entity.edgeSys.length; i++) {
                        entity.edgeSys[i] = [];
                    }
                    entity.tileMode = new Array(entity.tileMode.length).fill(false);
                }
            }

            canvasState.activeWeft = null;
            canvasState.clickSequence = 0;
            canvasState.pathsByWeft = {};
            canvasState.selectedDots = [];
            canvasState.hoveredDotIndex = -1;
            canvasState.showDeleteButton = false;
            canvasState.deleteButtonBounds = null;

            rebuildRenderCache();
            generateDraft();
            updateCallback(canvasState);
            p.redraw();
        }

        p.setup = function setup() {
            p.createCanvas(SKETCH_CANVAS_WIDTH, SKETCH_CANVAS_HEIGHT);
            p.textSize(14);

            if (needsReset) {
                // Brand new operation or parameter change
                resetCanvas();
            } else {
                // File restore — sync effective values from saved state
                if (!hasSeedDraft) {
                    effectiveWarpSystems = canvasState.manualWarpSystems ?? effectiveWarpSystems;
                    effectiveWeftSystems = canvasState.manualWeftSystems ?? effectiveWeftSystems;
                }
                effectiveNumWarps = canvasState.manualNumWarps ?? effectiveNumWarps;
                activeWarpSystems = Math.min(effectiveNumWarps, effectiveWarpSystems);
                draftGenerator = createDraft({ weftSystems: effectiveWeftSystems });

                canvasState.builtForWarpSystems = effectiveWarpSystems;
                canvasState.builtForWeftSystems = effectiveWeftSystems;

                // Rebuild render cache from warpAndEdgeData
                rebuildRenderCache();
                updateCallback(canvasState);
                p.redraw();
            }

            p.noLoop();
        };

        p.draw = function draw() {
            p.background(255);
            drawWeftSysIcons();
            drawLines();
            drawWarpDots();
            drawWeftDots('empty');
            drawSplines();
            drawWeftDots('filled');
            drawStickyLineToMouse();
            drawDeleteButton();
            drawResetButton();
            drawWarpSystemBadges();
            drawWarpIndexLabels();
            drawWarpSystemButtons();
            drawWarpCountButtons();
            drawWeftSystemButtons();
        };

        function drawLines() {
            const numColumns = effectiveNumWarps + 2; // Left Edge, Warps, Right Edge

            const firstColumnX = SKETCH_LEFT_MARGIN;
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const drawingWidth = lastColumnX - firstColumnX;

            let spacingX = 0;
            if (numColumns > 1) {
                spacingX = drawingWidth / (numColumns - 1);
            }

            // Recompute dot positions each frame
            canvasState.weftDots = computeWeftDotPositions();

            // --- Draw Warp Lines ---
            for (let i = 0; i < effectiveNumWarps; i++) {
                let currentX = firstColumnX + spacingX * (i + 1);
                p.stroke(0);
                p.strokeWeight(1);
                p.line(currentX, SKETCH_TOP_MARGIN, currentX, SKETCH_CANVAS_HEIGHT - SKETCH_BOTTOM_MARGIN);
            }

            // --- Draw Edge Lines (Dashed) ---
            const leftEdgeLineX = firstColumnX;
            const rightEdgeLineX = lastColumnX;

            p.stroke(128);
            p.strokeWeight(1);
            p.drawingContext.save();
            p.drawingContext.setLineDash([5, 5]);

            p.line(leftEdgeLineX, SKETCH_TOP_MARGIN, leftEdgeLineX, SKETCH_CANVAS_HEIGHT - SKETCH_BOTTOM_MARGIN);
            if (numColumns > 1 && rightEdgeLineX !== leftEdgeLineX) {
                p.line(rightEdgeLineX, SKETCH_TOP_MARGIN, rightEdgeLineX, SKETCH_CANVAS_HEIGHT - SKETCH_BOTTOM_MARGIN);
            }
            p.drawingContext.restore();
        }

        function drawWarpDots() {
            const numColumns = effectiveNumWarps + 2;
            const firstColumnX = SKETCH_LEFT_MARGIN;
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const drawingWidth = lastColumnX - firstColumnX;

            let spacingX = 0;
            if (numColumns > 1) {
                spacingX = drawingWidth / (numColumns - 1);
            }
            let spacingY = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (activeWarpSystems + 1);

            for (let i = 0; i < effectiveNumWarps; i++) {
                let currentX = firstColumnX + spacingX * (i + 1);
                const warpEntityData = canvasState.warpAndEdgeData[i + 1];
                if (warpEntityData && warpEntityData.type === 'warp') {
                    const warpLayer = ((warpEntityData.warpLayer ?? warpEntityData.warpSys) % activeWarpSystems);
                    let warpCenterY = SKETCH_TOP_MARGIN + spacingY * (warpLayer + 1);
                    const colorSys = warpEntityData.warpSys % activeWarpSystems;
                    const dotColor = warpColors.length > 0
                        ? warpColors[colorSys % warpColors.length]
                        : DEFAULT_WARP_DOT_COLOR;
                    p.fill(dotColor);
                    p.stroke(0);
                    p.strokeWeight(1);
                    const dotSize = warpDotSizes.length > 0
                        ? (warpDotSizes[colorSys % warpDotSizes.length] ?? DEFAULT_WARP_DOT_SIZE)
                        : DEFAULT_WARP_DOT_SIZE;
                    p.ellipse(currentX, warpCenterY, dotSize, dotSize);
                }
            }
        }

        // Check luminance different between background and font color (WCAG)
        function relativeLuminance(hex: string): number {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16) / 255;
            const g = parseInt(h.substring(2, 4), 16) / 255;
            const b = parseInt(h.substring(4, 6), 16) / 255;
            const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        }

        function contrastTextColor(hex: string): string {
            return relativeLuminance(hex) > 0.3 ? '#000000' : '#FFFFFF';
        }

        function drawWeftSysIcons() {
            let spacing = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (effectiveWeftSystems + 1);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            for (let i = 0; i < effectiveWeftSystems; i++) {
                let y = SKETCH_TOP_MARGIN + spacing * (i + 1);
                let weftColor = weftColors[i % weftColors.length];

                p.fill(weftColor);
                p.stroke(canvasState.activeWeft === i ? 80 : 200);
                p.strokeWeight(canvasState.activeWeft === i ? 2 : 1);
                p.ellipse(SKETCH_LEFT_MARGIN * 0.4, y, WEFT_ICON_SIZE, WEFT_ICON_SIZE);

                p.fill(contrastTextColor(weftColor));
                p.noStroke();
                p.textSize(WEFT_ICON_FONT_SIZE);
                p.text(String.fromCharCode(97 + i), SKETCH_LEFT_MARGIN * 0.4, y);
            }
        }

        // Apply render-time Y offset to tile-mode edge anchors based on subDot
        function applyTileModeOffsets(anchors: any[]): any[] {
            return anchors.map(a => {
                if (a.isTileModeEdge && a.subDot) {
                    const yOffset = a.subDot === 'top' ? -TILE_DOT_OFFSET : TILE_DOT_OFFSET;
                    return {
                        ...a,
                        pos: { x: a.pos.x, y: a.pos.y + yOffset },
                        cpBefore: { x: a.cpBefore.x, y: a.cpBefore.y + yOffset },
                        cpAfter: { x: a.cpAfter.x, y: a.cpAfter.y + yOffset }
                    };
                }
                return a;
            });
        }

        function drawSplines() {
            // Count total traversals per segment (every pass counts, even same weft doubling back)
            const segmentTraversalCount: Record<string, number> = {};
            for (const weftIdStr in canvasState.pathsByWeft) {
                const subPaths = canvasState.pathsByWeft[parseInt(weftIdStr, 10)];
                if (!subPaths) continue;
                for (const anchors of subPaths) {
                    if (anchors && anchors.length >= 2) {
                        for (let i = 0; i < anchors.length - 1; i++) {
                            const a = anchors[i].dotIdx;
                            const b = anchors[i + 1].dotIdx;
                            const key = Math.min(a, b) + ',' + Math.max(a, b);
                            segmentTraversalCount[key] = (segmentTraversalCount[key] || 0) + 1;
                        }
                    }
                }
            }

            // Each traversal claims the next position slot during rendering
            const segmentNextPosition: Record<string, number> = {};

            // Render each weft's sub-paths
            for (const weftIdStr in canvasState.pathsByWeft) {
                const weftId = parseInt(weftIdStr, 10);
                const subPaths = canvasState.pathsByWeft[weftId];
                if (!subPaths) continue;

                for (let spIdx = 0; spIdx < subPaths.length; spIdx++) {
                    const rawAnchors = subPaths[spIdx];
                    if (!rawAnchors || rawAnchors.length < 2) continue;

                    // Apply tile-mode Y offsets at render time
                    const anchors = applyTileModeOffsets(rawAnchors);

                    try {
                        bezierRenderer.calculateBezierControlPoints(anchors);
                    } catch (e) {
                        console.error('[CrossSectionView] Error calling calculateBezierControlPoints in draw:', e);
                        console.error('Path data that caused error:', JSON.parse(JSON.stringify({ weftId, anchors })));
                        p.noLoop();
                        return;
                    }

                    // Build per-segment overlap metadata
                    const segmentOverlaps: Array<{position: number, total: number, flipNormal: boolean}> = [];
                    for (let i = 0; i < anchors.length - 1; i++) {
                        const a = anchors[i].dotIdx;
                        const b = anchors[i + 1].dotIdx;
                        const key = Math.min(a, b) + ',' + Math.max(a, b);
                        const total = segmentTraversalCount[key] || 1;
                        if (total > 1) {
                            const position = segmentNextPosition[key] || 0;
                            segmentNextPosition[key] = position + 1;
                            segmentOverlaps.push({
                                position,
                                total,
                                flipNormal: a > b
                            });
                        } else {
                            segmentOverlaps.push({ position: 0, total: 1, flipNormal: false });
                        }
                    }

                    bezierRenderer.renderBezierPath(anchors, weftId, segmentOverlaps);
                }
            }
        }

        // Draw a single weft dot with fill color and concentric rings
        function drawSingleWeftDot(x: number, y: number, fills: number[]) {
            if (fills.length > 0) {
                p.fill(weftColors[fills[0] % weftColors.length]);
                p.stroke(0);
            } else {
                p.fill(255);
                p.stroke(140);
            }
            p.strokeWeight(1);
            p.ellipse(x, y, WEFT_DOT_SIZE, WEFT_DOT_SIZE);

            for (let r = 1; r < fills.length; r++) {
                p.noFill();
                p.stroke(weftColors[fills[r] % weftColors.length]);
                p.strokeWeight(2);
                p.ellipse(x, y, WEFT_DOT_SIZE + r * 4, WEFT_DOT_SIZE + r * 4);
            }
        }

        // Draw weft dots filtered by fill state -- empty behind curves, filled on top
        function drawWeftDots(mode: 'empty' | 'filled') {
            const wantFilled = mode === 'filled';
            for (let i = 0; i < canvasState.weftDots.length; i++) {
                const dot = canvasState.weftDots[i];

                if (isEdgeDotInTileMode(i)) {
                    const tileFills = canvasState.tileDotFills[i] || { top: [], bottom: [] };
                    let topFills = tileFills.top;
                    let bottomFills = tileFills.bottom;
                    if (wantFilled && provisionalFill && provisionalFill.dotIndex === i) {
                        if (provisionalFill.subDot === 'top') {
                            topFills = [...topFills, provisionalFill.weftId];
                        } else {
                            bottomFills = [...bottomFills, provisionalFill.weftId];
                        }
                    }
                    const isProvisionalTop = provisionalFill?.dotIndex === i && provisionalFill?.subDot === 'top';
                    const isProvisionalBottom = provisionalFill?.dotIndex === i && provisionalFill?.subDot === 'bottom';
                    if (wantFilled) {
                        if (topFills.length > 0) drawSingleWeftDot(dot.x, dot.y - TILE_DOT_OFFSET, topFills);
                        if (bottomFills.length > 0) drawSingleWeftDot(dot.x, dot.y + TILE_DOT_OFFSET, bottomFills);
                    } else {
                        if (topFills.length === 0 && !isProvisionalTop) drawSingleWeftDot(dot.x, dot.y - TILE_DOT_OFFSET, []);
                        if (bottomFills.length === 0 && !isProvisionalBottom) drawSingleWeftDot(dot.x, dot.y + TILE_DOT_OFFSET, []);
                    }
                } else {
                    const fills = canvasState.dotFills[i];
                    if (wantFilled) {
                        if (fills && fills.length > 0) {
                            drawSingleWeftDot(dot.x, dot.y, fills);
                        }
                    } else {
                        if (!fills || fills.length === 0) {
                            drawSingleWeftDot(dot.x, dot.y, []);
                        }
                    }
                }
            }

            // Draw tile-mode hover preview animation (ghost dots)
            if (wantFilled && tileHoverAnim) {
                const dot = canvasState.weftDots[tileHoverAnim.dotIndex];
                if (dot) {
                    const elapsed = p.millis() - tileHoverAnim.startTime;
                    const t = Math.min(elapsed / TILE_TOGGLE_DURATION, 1); // 0->1 over duration

                    p.push();
                    if (tileHoverAnim.fromTile) {
                        // Tile -> Loop preview: ghost dot at center
                        p.fill(255, TILE_GHOST_OPACITY);
                        p.stroke(180, TILE_GHOST_OPACITY);
                        p.strokeWeight(1);
                        p.ellipse(dot.x, dot.y, WEFT_DOT_SIZE, WEFT_DOT_SIZE);
                    } else {
                        // Loop -> Tile preview: ghost dots slide apart from center
                        const offset = TILE_DOT_OFFSET * t;
                        p.fill(255, TILE_GHOST_OPACITY);
                        p.stroke(180, TILE_GHOST_OPACITY);
                        p.strokeWeight(1);
                        p.ellipse(dot.x, dot.y - offset, WEFT_DOT_SIZE, WEFT_DOT_SIZE);
                        p.ellipse(dot.x, dot.y + offset, WEFT_DOT_SIZE, WEFT_DOT_SIZE);
                    }
                    p.pop();

                    // Stop loop after animation completes but keep ghost visible
                    if (t >= 1 && canvasState.activeWeft === null) {
                        p.noLoop();
                    }
                }
            }
        }

        function drawStickyLineToMouse() {
            if (canvasState.activeWeft !== null) {
                const activeWeftColorHex = weftColors[canvasState.activeWeft % weftColors.length];

                // If provisional fill is active, sticky line starts from the departure dot
                if (provisionalFill && provisionalFill.weftId === canvasState.activeWeft) {
                    const dot = canvasState.weftDots[provisionalFill.dotIndex];
                    if (dot) {
                        const departY = dot.y + (provisionalFill.subDot === 'top' ? -TILE_DOT_OFFSET : TILE_DOT_OFFSET);
                        p.stroke(activeWeftColorHex);
                        p.strokeWeight(2);
                        p.line(dot.x, departY, p.mouseX, p.mouseY);
                    }
                    return;
                }

                const subPaths = canvasState.pathsByWeft[canvasState.activeWeft];
                if (subPaths && subPaths.length > 0) {
                    const lastSubPath = subPaths[subPaths.length - 1];
                    if (lastSubPath && lastSubPath.length > 0) {
                        const lastAnchor = lastSubPath[lastSubPath.length - 1];
                        // Apply tile-mode Y offset for sticky line origin
                        let stickyY = lastAnchor.pos.y;
                        if (lastAnchor.isTileModeEdge && lastAnchor.subDot) {
                            stickyY += lastAnchor.subDot === 'top' ? -TILE_DOT_OFFSET : TILE_DOT_OFFSET;
                        }
                        p.stroke(activeWeftColorHex);
                        p.strokeWeight(2);
                        p.line(lastAnchor.pos.x, stickyY, p.mouseX, p.mouseY);
                    }
                }
            }
        }

        function drawDeleteButton() {
            if (canvasState.showDeleteButton && canvasState.hoveredDotIndex >= 0 && canvasState.deleteButtonBounds) {
                // Draw delete button background
                p.fill(255, 100, 100);
                p.stroke(200, 50, 50);
                p.strokeWeight(1);
                p.rect(canvasState.deleteButtonBounds.x, canvasState.deleteButtonBounds.y, canvasState.deleteButtonBounds.w, canvasState.deleteButtonBounds.h, 2);

                // Draw X
                p.stroke(255);
                p.strokeWeight(2);
                let padding = 3;
                p.line(
                    canvasState.deleteButtonBounds.x + padding,
                    canvasState.deleteButtonBounds.y + padding,
                    canvasState.deleteButtonBounds.x + canvasState.deleteButtonBounds.w - padding,
                    canvasState.deleteButtonBounds.y + canvasState.deleteButtonBounds.h - padding
                );
                p.line(
                    canvasState.deleteButtonBounds.x + canvasState.deleteButtonBounds.w - padding,
                    canvasState.deleteButtonBounds.y + padding,
                    canvasState.deleteButtonBounds.x + padding,
                    canvasState.deleteButtonBounds.y + canvasState.deleteButtonBounds.h - padding
                );
            }
        }

        function drawResetButton() {
            p.fill(240);
            p.stroke(180);
            p.strokeWeight(1);
            p.rect(RESET_BUTTON.x, RESET_BUTTON.y, RESET_BUTTON.w, RESET_BUTTON.h, 3);

            p.fill(60);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14);
            p.text('Reset Picks', RESET_BUTTON.x + RESET_BUTTON.w / 2, RESET_BUTTON.y + RESET_BUTTON.h / 2);
        }

        // ── Integrated Controls ──────────────────────────────────────
        type StepperLayout = {
            shape: 'ellipse';
            minusCx: number; minusCy: number;
            plusCx: number; plusCy: number;
            size: number;
            fontSize: number;
            textColor: string;
        } | {
            shape: 'rect';
            minusLeft: number; plusLeft: number;
            top: number; w: number; h: number;
            cornerRadius: number;
            fontSize: number;
            textColor: string;
        };

        function drawStepperButtons(layout: StepperLayout, atMin: boolean, atMax: boolean) {
            const drawBtn = (disabled: boolean, label: string) => {
                p.strokeWeight(1);
                p.fill(disabled ? '#F0F0F0' : '#F5F5F5');
                p.stroke(disabled ? '#D8D8D8' : '#B0B0B0');
                if (layout.shape === 'ellipse') {
                    const cx = label === '-' ? layout.minusCx : layout.plusCx;
                    p.ellipse(cx, layout.minusCy, layout.size, layout.size);
                    p.noStroke();
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(layout.fontSize);
                    p.fill(disabled ? '#C8C8C8' : layout.textColor);
                    p.text(label, cx, layout.minusCy);
                } else {
                    const left = label === '-' ? layout.minusLeft : layout.plusLeft;
                    p.rect(left, layout.top, layout.w, layout.h, layout.cornerRadius);
                    p.noStroke();
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(layout.fontSize);
                    p.fill(disabled ? '#C8C8C8' : layout.textColor);
                    p.text(label, left + layout.w / 2, layout.top + layout.h / 2);
                }
            };
            drawBtn(atMin, '-');
            drawBtn(atMax, '+');
        }

        // Returns +1, -1, or 0 (no hit)
        function hitTestStepperButtons(mx: number, my: number, layout: StepperLayout, atMin: boolean, atMax: boolean): number {
            if (layout.shape === 'ellipse') {
                const r = layout.size / 2;
                const dxM = mx - layout.minusCx;
                const dyM = my - layout.minusCy;
                if (dxM * dxM + dyM * dyM <= r * r && !atMin) return -1;
                const dxP = mx - layout.plusCx;
                const dyP = my - layout.plusCy;
                if (dxP * dxP + dyP * dyP <= r * r && !atMax) return 1;
            } else {
                if (my >= layout.top && my <= layout.top + layout.h) {
                    if (mx >= layout.minusLeft && mx <= layout.minusLeft + layout.w && !atMin) return -1;
                    if (mx >= layout.plusLeft && mx <= layout.plusLeft + layout.w && !atMax) return 1;
                }
            }
            return 0;
        }

        // Weft system [-][+] buttons: circles below last weft icon, centered horizontally
        function computeWeftButtonLayout(): StepperLayout {
            const spacing = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (effectiveWeftSystems + 1);
            const lastWeftY = SKETCH_TOP_MARGIN + spacing * effectiveWeftSystems;
            const btnY = lastWeftY + spacing * 0.7;
            const centerX = SKETCH_LEFT_MARGIN * 0.4;
            const btnSize = WEFT_ICON_SIZE * 0.7;
            const gap = 4;
            return {
                shape: 'ellipse',
                minusCx: centerX - btnSize / 2 - gap / 2,
                minusCy: btnY,
                plusCx: centerX + btnSize / 2 + gap / 2,
                plusCy: btnY,
                size: btnSize,
                fontSize: 18,
                textColor: '#808080'
            };
        }

        function drawWeftSystemButtons() {
            const layout = computeWeftButtonLayout();
            const atMin = hasSeedDraft || effectiveWeftSystems <= MIN_WEFT_SYSTEMS;
            const atMax = hasSeedDraft || effectiveWeftSystems >= MAX_WEFT_SYSTEMS;
            drawStepperButtons(layout, atMin, atMax);
        }

        // Returns +1, -1, or 0 (no hit)
        function isInsideWeftSystemButton(mx: number, my: number): number {
            if (hasSeedDraft) return 0;
            const layout = computeWeftButtonLayout();
            const atMin = effectiveWeftSystems <= MIN_WEFT_SYSTEMS;
            const atMax = effectiveWeftSystems >= MAX_WEFT_SYSTEMS;
            return hitTestStepperButtons(mx, my, layout, atMin, atMax);
        }

        // Shared layout for warp system badges, badge buttons, and badge hit-tests
        function computeBadgeLayout() {
            const numColumns = effectiveNumWarps + 2;
            const firstColumnX = SKETCH_LEFT_MARGIN;
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const drawingWidth = lastColumnX - firstColumnX;
            const spacingX = numColumns > 1 ? drawingWidth / (numColumns - 1) : 0;

            const maxBadgeW = spacingX * 0.8;
            const badgeW = Math.max(BADGE_MIN_W, Math.min(BADGE_BASE_W, maxBadgeW));
            const scale = badgeW < BADGE_BASE_W ? badgeW / BADGE_BASE_W : 1;
            const badgeH = Math.max(BADGE_MIN_H, BADGE_BASE_H * scale);
            const fontSize = Math.max(BADGE_MIN_FONT, BADGE_FONT_SIZE * scale);
            return { firstColumnX, spacingX, badgeW, badgeH, fontSize };
        }

        // Warp system [-][+] buttons: pill pair after last badge in the badge row
        function computeWarpSystemButtonLayout(): StepperLayout {
            const { firstColumnX, spacingX, badgeW, badgeH, fontSize } = computeBadgeLayout();
            const lastBadgeCx = firstColumnX + spacingX * effectiveNumWarps;
            const centerX = lastBadgeCx + spacingX * 0.7;
            const gap = 2;
            return {
                shape: 'rect',
                minusLeft: centerX - badgeW - gap / 2,
                plusLeft: centerX + gap / 2,
                top: BADGE_CENTER_Y - badgeH / 2,
                w: badgeW, h: badgeH,
                cornerRadius: badgeH / 2,
                fontSize,
                textColor: '#808080'
            };
        }

        function drawWarpSystemButtons() {
            const layout = computeWarpSystemButtonLayout();
            const atMin = hasSeedDraft || effectiveWarpSystems <= MIN_WARP_SYSTEMS;
            const atMax = hasSeedDraft || effectiveWarpSystems >= MAX_WARP_SYSTEMS;
            drawStepperButtons(layout, atMin, atMax);
        }

        // Returns +1, -1, or 0 (no hit)
        function isInsideWarpSystemButton(mx: number, my: number): number {
            if (hasSeedDraft) return 0;
            const layout = computeWarpSystemButtonLayout();
            const atMin = effectiveWarpSystems <= MIN_WARP_SYSTEMS;
            const atMax = effectiveWarpSystems >= MAX_WARP_SYSTEMS;
            return hitTestStepperButtons(mx, my, layout, atMin, atMax);
        }

        // Warp count [+][-] buttons: above right edge line
        function computeWarpCountButtonLayout(): StepperLayout {
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const btnW = 22;
            const btnH = 20;
            const btnY = 70;
            const gap = 4;
            return {
                shape: 'rect',
                minusLeft: lastColumnX - btnW - gap / 2,
                plusLeft: lastColumnX + gap / 2,
                top: btnY, w: btnW, h: btnH,
                cornerRadius: 3,
                fontSize: 14,
                textColor: '#606060'
            };
        }

        function drawWarpCountButtons() {
            const layout = computeWarpCountButtonLayout();
            const atMin = effectiveNumWarps <= MIN_WARPS;
            const atMax = effectiveNumWarps >= MAX_WARPS;
            drawStepperButtons(layout, atMin, atMax);
        }

        // Returns +1, -1, or 0 (no hit)
        function isInsideWarpCountButton(mx: number, my: number): number {
            const layout = computeWarpCountButtonLayout();
            const atMin = effectiveNumWarps <= MIN_WARPS;
            const atMax = effectiveNumWarps >= MAX_WARPS;
            return hitTestStepperButtons(mx, my, layout, atMin, atMax);
        }

        function drawWarpSystemBadges() {
            const { firstColumnX, spacingX, badgeW, badgeH, fontSize } = computeBadgeLayout();

            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(fontSize);

            for (let i = 0; i < effectiveNumWarps; i++) {
                const cx = firstColumnX + spacingX * (i + 1);
                const warpEntity = canvasState.warpAndEdgeData[i + 1];
                if (!warpEntity || warpEntity.type !== 'warp') continue;

                const displayNum = ((warpEntity.warpLayer ?? warpEntity.warpSys) % activeWarpSystems) + 1;
                const isHovered = hoveredBadgeWarp === i;

                const left = cx - badgeW / 2;
                const top = BADGE_CENTER_Y - badgeH / 2;
                const cornerRadius = badgeH / 2;

                // Background
                p.fill(isHovered ? '#DCDCDC' : '#E8E8E8');
                p.stroke(isHovered ? '#787878' : '#B4B4B4');
                p.strokeWeight(1);
                p.rect(left, top, badgeW, badgeH, cornerRadius);

                // Text
                p.fill(isHovered ? '#000000' : '#3C3C3C');
                p.noStroke();
                p.text(displayNum, cx, BADGE_CENTER_Y);
            }
        }

        function drawWarpIndexLabels() {
            const { firstColumnX, spacingX } = computeBadgeLayout();
            const labelY = SKETCH_CANVAS_HEIGHT - SKETCH_BOTTOM_MARGIN + 2;

            p.fill(160);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(11);

            for (let i = 0; i < effectiveNumWarps; i++) {
                const cx = firstColumnX + spacingX * (i + 1);
                p.text(i + 1, cx, labelY);
            }
        }

        function isInsideResetButton(mx: number, my: number): boolean {
            return mx >= RESET_BUTTON.x && mx <= RESET_BUTTON.x + RESET_BUTTON.w &&
                   my >= RESET_BUTTON.y && my <= RESET_BUTTON.y + RESET_BUTTON.h;
        }

        // Hit-test warp system badges. Returns 0-based warp index or -1.
        function isInsideWarpBadge(mx: number, my: number): number {
            const { firstColumnX, spacingX, badgeW, badgeH } = computeBadgeLayout();

            for (let i = 0; i < effectiveNumWarps; i++) {
                const cx = firstColumnX + spacingX * (i + 1);
                const left = cx - badgeW / 2;
                const top = BADGE_CENTER_Y - badgeH / 2;
                if (mx >= left && mx <= left + badgeW && my >= top && my <= top + badgeH) {
                    return i;
                }
            }
            return -1;
        }

        p.mouseMoved = function mouseMoved() {
            let previousHoveredDot = canvasState.hoveredDotIndex;
            let previousShowDelete = canvasState.showDeleteButton;

            // Check if hovering over the reset button
            if (isInsideResetButton(p.mouseX, p.mouseY)) {
                p.cursor(p.HAND);
                return;
            }

            // Check if hovering over integrated controls
            if (isInsideWeftSystemButton(p.mouseX, p.mouseY) !== 0 ||
                isInsideWarpSystemButton(p.mouseX, p.mouseY) !== 0 ||
                isInsideWarpCountButton(p.mouseX, p.mouseY) !== 0) {
                p.cursor(p.HAND);
                return;
            }

            // Check if hovering over a warp system badge
            const newHoveredBadge = isInsideWarpBadge(p.mouseX, p.mouseY);
            if (newHoveredBadge >= 0) {
                p.cursor(p.HAND);
                if (newHoveredBadge !== hoveredBadgeWarp) {
                    hoveredBadgeWarp = newHoveredBadge;
                    p.redraw();
                }
                return;
            }
            if (hoveredBadgeWarp >= 0) {
                hoveredBadgeWarp = -1;
                p.redraw();
            }

            // First check if we're hovering over the delete button itself
            if (canvasState.deleteButtonBounds &&
                p.mouseX >= canvasState.deleteButtonBounds.x - 2 && p.mouseX <= canvasState.deleteButtonBounds.x + canvasState.deleteButtonBounds.w + 2 &&
                p.mouseY >= canvasState.deleteButtonBounds.y - 2 && p.mouseY <= canvasState.deleteButtonBounds.y + canvasState.deleteButtonBounds.h + 2) {
                // Keep the delete button visible when hovering over it
                p.cursor(p.HAND);
                return;
            }

            canvasState.hoveredDotIndex = -1;
            canvasState.hoveredSubDot = undefined;
            canvasState.showDeleteButton = false;
            canvasState.deleteButtonBounds = null;

            // Check if hovering over any dot (tile-mode aware)
            const hoverHit = findHitDot(p.mouseX, p.mouseY);
            if (hoverHit) {
                canvasState.hoveredDotIndex = hoverHit.dotIndex;
                canvasState.hoveredSubDot = hoverHit.subDot;
                const dot = canvasState.weftDots[hoverHit.dotIndex];

                // Only show delete button if:
                // 1. No active weft is selected (not actively drawing)
                // 2. The dot has at least one weft assigned
                if (canvasState.activeWeft === null && canvasState.dotFills[hoverHit.dotIndex].length > 0) {
                    canvasState.showDeleteButton = true;
                    // Position delete button relative to the hit position
                    const hitY = hoverHit.subDot === 'top' ? dot.y - TILE_DOT_OFFSET
                               : hoverHit.subDot === 'bottom' ? dot.y + TILE_DOT_OFFSET
                               : dot.y;
                    canvasState.deleteButtonBounds = {
                        x: dot.x + 8,
                        y: hitY - 18,
                        w: 16,
                        h: 16
                    };
                }
            }

            // Tile-mode hover preview animation
            let previousTileHover = tileHoverAnim;
            if (hoverHit && canvasState.activeWeft === null) {
                const info = getDotInfo(hoverHit.dotIndex);
                if (info.posType === 'edgeSys') {
                    const entity = canvasState.warpAndEdgeData[info.idx];
                    const isTile = entity.tileMode && entity.tileMode[info.warpSysId!];
                    if (!tileHoverAnim || tileHoverAnim.dotIndex !== hoverHit.dotIndex) {
                        tileHoverAnim = { dotIndex: hoverHit.dotIndex, startTime: p.millis(), fromTile: isTile };
                        p.loop(); // need animation frames
                    }
                } else {
                    tileHoverAnim = null;
                }
            } else {
                tileHoverAnim = null;
            }
            // Stop animation loop when hover ends and no active weft
            if (previousTileHover && !tileHoverAnim && canvasState.activeWeft === null) {
                p.noLoop();
                p.redraw();
            }

            // Redraw if hover state changed
            if (previousHoveredDot !== canvasState.hoveredDotIndex || previousShowDelete !== canvasState.showDeleteButton) {
                p.redraw();
            }

            // Update cursor
            if (canvasState.showDeleteButton && canvasState.deleteButtonBounds &&
                p.mouseX >= canvasState.deleteButtonBounds.x && p.mouseX <= canvasState.deleteButtonBounds.x + canvasState.deleteButtonBounds.w &&
                p.mouseY >= canvasState.deleteButtonBounds.y && p.mouseY <= canvasState.deleteButtonBounds.y + canvasState.deleteButtonBounds.h) {
                p.cursor(p.HAND);
            } else if (canvasState.hoveredDotIndex >= 0) {
                p.cursor(p.HAND);
            } else {
                p.cursor(p.ARROW);
            }
        }

        p.mousePressed = function mousePressed() {
            // Check reset button click
            if (isInsideResetButton(p.mouseX, p.mouseY)) {
                resetWeftSplines();
                return;
            }

            // Check integrated control clicks
            const weftSysDelta = isInsideWeftSystemButton(p.mouseX, p.mouseY);
            if (weftSysDelta !== 0) {
                const current = canvasState.manualWeftSystems || effectiveWeftSystems;
                canvasState.manualWeftSystems = Math.max(MIN_WEFT_SYSTEMS, Math.min(MAX_WEFT_SYSTEMS, current + weftSysDelta));
                resetCanvas();
                return;
            }
            const warpSysDelta = isInsideWarpSystemButton(p.mouseX, p.mouseY);
            if (warpSysDelta !== 0) {
                const current = canvasState.manualWarpSystems || effectiveWarpSystems;
                canvasState.manualWarpSystems = Math.max(MIN_WARP_SYSTEMS, Math.min(MAX_WARP_SYSTEMS, current + warpSysDelta));
                resetCanvas();
                return;
            }
            const warpCountDelta = isInsideWarpCountButton(p.mouseX, p.mouseY);
            if (warpCountDelta !== 0) {
                const current = canvasState.manualNumWarps || effectiveNumWarps;
                canvasState.manualNumWarps = Math.max(MIN_WARPS, Math.min(MAX_WARPS, current + warpCountDelta));
                resetCanvas();
                return;
            }

            // Check warp system badge click
            const clickedBadgeWarp = isInsideWarpBadge(p.mouseX, p.mouseY);
            if (clickedBadgeWarp >= 0) {
                cycleWarpSystem(clickedBadgeWarp);
                return;
            }

            let spacing = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (effectiveWeftSystems + 1);

            // Check weft system clicks
            for (let i = 0; i < effectiveWeftSystems; i++) {
                let y = SKETCH_TOP_MARGIN + spacing * (i + 1);
                if (p.dist(p.mouseX, p.mouseY, SKETCH_LEFT_MARGIN * 0.4, y) < WEFT_ICON_SIZE) {
                    const clickedWeftId = i;
                    if (canvasState.activeWeft === clickedWeftId) {
                        // User clicked the same active weft button (to deselect/complete open path)
                        editedWeftIds.delete(clickedWeftId);
                        canvasState.activeWeft = null;
                        provisionalFill = null;
                        p.noLoop();
                    } else {
                        // User clicked a new weft button or re-selected one.
                        // If there was an active path for a *different* weft, finalize it first.
                        if (canvasState.activeWeft !== null) {
                            editedWeftIds.delete(canvasState.activeWeft);
                        }
                        provisionalFill = null; // clear any previous provisional
                        canvasState.activeWeft = clickedWeftId;

                        // Check if re-engaging a weft that ended at a tile-mode edge
                        const subPaths = canvasState.pathsByWeft[clickedWeftId];
                        if (subPaths && subPaths.length > 0) {
                            const lastSubPath = subPaths[subPaths.length - 1];
                            if (lastSubPath && lastSubPath.length > 0) {
                                const lastAnchor = lastSubPath[lastSubPath.length - 1];
                                if (lastAnchor.isTileModeEdge && lastAnchor.subDot) {
                                    // Set provisional fill on the departure dot (opposite of arrival)
                                    const departSubDot: 'top' | 'bottom' = lastAnchor.subDot === 'top' ? 'bottom' : 'top';
                                    provisionalFill = {
                                        dotIndex: lastAnchor.dotIdx,
                                        weftId: clickedWeftId,
                                        subDot: departSubDot
                                    };
                                }
                            }
                        }

                        p.loop();
                    }
                    p.redraw();
                    generateDraft();
                    // Report the new canvasState to the operation
                    updateCallback(canvasState);
                    return;
                }
            }

            // Check delete button click
            if (canvasState.showDeleteButton && canvasState.deleteButtonBounds && canvasState.activeWeft === null) {
                if (p.mouseX >= canvasState.deleteButtonBounds.x && p.mouseX <= canvasState.deleteButtonBounds.x + canvasState.deleteButtonBounds.w &&
                    p.mouseY >= canvasState.deleteButtonBounds.y && p.mouseY <= canvasState.deleteButtonBounds.y + canvasState.deleteButtonBounds.h) {
                    // Delete the most recent weft from the hovered dot
                    let dotIdx = canvasState.hoveredDotIndex;
                    const { idx, posType, warpSysId } = getDotInfo(dotIdx);

                    // Select the appropriate weft array
                    let weftArray;
                    const targetEntity = canvasState.warpAndEdgeData[idx];
                    if (posType === 'edgeSys' && warpSysId !== undefined) {
                        weftArray = targetEntity.edgeSys[warpSysId];
                    } else { // 'topWeft' or 'bottomWeft'
                        weftArray = targetEntity[posType];
                    }

                    // Find the most recent weft assignment (highest sequence number)
                    let mostRecentWeft = -1;
                    let mostRecentIndex = -1;
                    let highestSequence = -1;

                    for (let j = 0; j < weftArray.length; j++) {
                        if (weftArray[j].sequence > highestSequence) {
                            highestSequence = weftArray[j].sequence;
                            mostRecentIndex = j;
                            mostRecentWeft = weftArray[j].weft;
                        }
                    }

                    if (mostRecentIndex !== -1) {
                        // Paired deletion for tile-mode edges: remove both arrival and departure
                        if (posType === 'edgeSys' && isEdgeDotInTileMode(dotIdx)) {
                            // Find the paired interaction: same weft, same edge dot
                            // Sort this weft's interactions at this edge by sequence
                            const weftInteractions: Array<{index: number, sequence: number}> = [];
                            for (let j = 0; j < weftArray.length; j++) {
                                if (weftArray[j].weft === mostRecentWeft) {
                                    weftInteractions.push({ index: j, sequence: weftArray[j].sequence });
                                }
                            }
                            weftInteractions.sort((a, b) => b.sequence - a.sequence);

                            // Remove the two most recent interactions for this weft (arrival + departure)
                            const toRemove = weftInteractions.slice(0, 2);
                            // Sort by index descending so splicing doesn't shift later indices
                            toRemove.sort((a, b) => b.index - a.index);
                            for (const item of toRemove) {
                                const removedSeq = weftArray[item.index].sequence;
                                weftArray.splice(item.index, 1);
                                updateSequenceNumbers(removedSeq);
                            }
                        } else {
                            // Normal single deletion
                            const removedSequence = weftArray[mostRecentIndex].sequence;
                            weftArray.splice(mostRecentIndex, 1);
                            updateSequenceNumbers(removedSequence);
                        }

                        // Mark this weft as "edited" so future additions insert at the
                        // correct sequence position instead of appending at the end
                        editedWeftIds.add(mostRecentWeft);
                    }

                    canvasState.showDeleteButton = false;
                    canvasState.hoveredDotIndex = -1;
                    canvasState.deleteButtonBounds = null;

                    // Rebuild render cache (derives dotFills, selectedDots, pathsByWeft, draft)
                    rebuildRenderCache();

                    p.redraw();
                    // Report the new canvasState to the operation
                    updateCallback(canvasState);
                    return;
                }
            }

            // Check dot clicks (tile-mode aware)
            const dotHit = findHitDot(p.mouseX, p.mouseY);

            // Tile-mode toggle: click edge dot with no active weft
            if (dotHit && canvasState.activeWeft === null) {
                const info = getDotInfo(dotHit.dotIndex);
                if (info.posType === 'edgeSys') {
                    const entity = canvasState.warpAndEdgeData[info.idx];
                    entity.tileMode[info.warpSysId!] = !entity.tileMode[info.warpSysId!];
                    if (entity.tileMode[info.warpSysId!]) {
                        assignSubDotsOnLoopToTile(info.idx, info.warpSysId!);
                    } else {
                        removeSubDotsOnTileToLoop(info.idx, info.warpSysId!);
                    }
                    tileHoverAnim = null;
                    provisionalFill = null;
                    canvasState.showDeleteButton = false;
                    canvasState.deleteButtonBounds = null;
                    rebuildRenderCache();
                    p.redraw();
                    updateCallback(canvasState);
                    return;
                }
            }

            if (dotHit && canvasState.activeWeft !== null) {
                const dotIndex = dotHit.dotIndex;

                // Confirm provisional fill: write the departure interaction before the new click
                if (provisionalFill && provisionalFill.weftId === canvasState.activeWeft) {
                    const provInfo = getDotInfo(provisionalFill.dotIndex);
                    let provArray;
                    const provEntity = canvasState.warpAndEdgeData[provInfo.idx];
                    if (provInfo.posType === 'edgeSys' && provInfo.warpSysId !== undefined) {
                        provArray = provEntity.edgeSys[provInfo.warpSysId];
                    } else {
                        provArray = provEntity[provInfo.posType];
                    }
                    const provSequence = getSequenceForNewInteraction(canvasState.activeWeft);
                    provArray.push({
                        weft: canvasState.activeWeft,
                        sequence: provSequence,
                        subDot: provisionalFill.subDot
                    });
                    provisionalFill = null;
                }

                // --- Update warpAndEdgeData (source of truth) ---
                const { idx, posType, warpSysId } = getDotInfo(dotIndex);
                let weftArray;
                const targetEntity = canvasState.warpAndEdgeData[idx];
                if (posType === 'edgeSys' && warpSysId !== undefined) {
                    weftArray = targetEntity.edgeSys[warpSysId];
                } else { // 'topWeft' or 'bottomWeft'
                    weftArray = targetEntity[posType];
                }

                const newSequence = getSequenceForNewInteraction(canvasState.activeWeft);
                const newInteraction: any = {
                    weft: canvasState.activeWeft,
                    sequence: newSequence
                };
                // Store subDot for tile-mode edge interactions
                if (dotHit.subDot) {
                    newInteraction.subDot = dotHit.subDot;
                }
                weftArray.push(newInteraction);

                // After clicking a tile-mode edge dot as arrival, set provisional fill
                // on the departure dot so the sticky line originates from there.
                // Skip if this is the weft's very first interaction (starting here, not arriving).
                if (dotHit.subDot && isEdgeDotInTileMode(dotIndex)) {
                    let weftInteractionCount = 0;
                    for (const e of canvasState.warpAndEdgeData) {
                        if (e.type === 'warp') {
                            for (const a of e.topWeft) if (a.weft === canvasState.activeWeft) weftInteractionCount++;
                            for (const a of e.bottomWeft) if (a.weft === canvasState.activeWeft) weftInteractionCount++;
                        } else if (e.type === 'edge') {
                            for (const sys of e.edgeSys) {
                                for (const a of sys) if (a.weft === canvasState.activeWeft) weftInteractionCount++;
                            }
                        }
                    }
                    if (weftInteractionCount > 1) {
                        const departSubDot: 'top' | 'bottom' = dotHit.subDot === 'top' ? 'bottom' : 'top';
                        provisionalFill = {
                            dotIndex: dotIndex,
                            weftId: canvasState.activeWeft,
                            subDot: departSubDot
                        };
                    }
                }

                // Rebuild render cache (derives dotFills, selectedDots, pathsByWeft, draft)
                rebuildRenderCache();

                // Ensure draw loop is running for sticky line if path not closed
                if (canvasState.activeWeft !== null) {
                    p.loop();
                }

                p.redraw();
                updateCallback(canvasState);
                return;
            }

            // Clicks outside of any dots (if an active weft is selected)
            if (canvasState.activeWeft !== null) {
                editedWeftIds.delete(canvasState.activeWeft);
                canvasState.activeWeft = null;
                provisionalFill = null;
                p.noLoop();
                p.redraw();
                generateDraft();
                // Report the new canvasState to the operation
                updateCallback(canvasState);
            }
        }


        // Helper Functions

        // Returns the correct sequence number for a new interaction. For "edited"
        // wefts (ones that had dots deleted), inserts the new interaction right
        // after the weft's existing interactions in the global sequence, shifting
        // later interactions up. This keeps the weft's interactions contiguous so
        // the draft algorithm produces a single row instead of splitting into two.
        // For non-edited wefts, appends at the end (normal behavior).
        function getSequenceForNewInteraction(weftId: number): number {
            if (!editedWeftIds.has(weftId)) {
                // Normal: append at end of global sequence
                const seq = canvasState.clickSequence;
                canvasState.clickSequence++;
                return seq;
            }

            // Find the highest sequence number among this weft's existing interactions
            let maxSeqForWeft = -1;
            for (const entity of canvasState.warpAndEdgeData) {
                if (entity.type === 'warp') {
                    for (const a of entity.topWeft) if (a.weft === weftId && a.sequence > maxSeqForWeft) maxSeqForWeft = a.sequence;
                    for (const a of entity.bottomWeft) if (a.weft === weftId && a.sequence > maxSeqForWeft) maxSeqForWeft = a.sequence;
                } else if (entity.type === 'edge') {
                    for (const sys of entity.edgeSys) {
                        for (const a of sys) if (a.weft === weftId && a.sequence > maxSeqForWeft) maxSeqForWeft = a.sequence;
                    }
                }
            }

            // If weft has no existing interactions, append at end
            if (maxSeqForWeft === -1) {
                const seq = canvasState.clickSequence;
                canvasState.clickSequence++;
                return seq;
            }

            const insertAt = maxSeqForWeft + 1;

            // If already at end of sequence, append normally
            if (insertAt >= canvasState.clickSequence) {
                const seq = canvasState.clickSequence;
                canvasState.clickSequence++;
                return seq;
            }

            // Shift all sequences >= insertAt up by 1 to make room
            for (const entity of canvasState.warpAndEdgeData) {
                if (entity.type === 'warp') {
                    for (const a of entity.topWeft) if (a.sequence >= insertAt) a.sequence++;
                    for (const a of entity.bottomWeft) if (a.sequence >= insertAt) a.sequence++;
                } else if (entity.type === 'edge') {
                    for (const sys of entity.edgeSys) {
                        for (const a of sys) if (a.sequence >= insertAt) a.sequence++;
                    }
                }
            }

            canvasState.clickSequence++;
            return insertAt;
        }

        function updateSequenceNumbers(removedSequence: number) {
            for (let entity of canvasState.warpAndEdgeData) {
                if (entity.type === 'warp') {
                    // Process top wefts
                    for (let assignment of entity.topWeft) {
                        if (assignment.sequence > removedSequence) {
                            assignment.sequence--;
                        }
                    }
                    // Process bottom wefts
                    for (let assignment of entity.bottomWeft) {
                        if (assignment.sequence > removedSequence) {
                            assignment.sequence--;
                        }
                    }
                } else if (entity.type === 'edge') {
                    // Process edge systems
                    for (let systemArray of entity.edgeSys) {
                        for (let assignment of systemArray) {
                            if (assignment.sequence > removedSequence) {
                                assignment.sequence--;
                            }
                        }
                    }
                }
            }

            canvasState.clickSequence--;
        }

        function getDotInfo(originalDotIndex: number) {
            const numLeftEdgeDots = activeWarpSystems;
            const numWarpCoreDots = effectiveNumWarps * 2;

            // Check Left Edge Dots
            if (originalDotIndex < numLeftEdgeDots) {
                return {
                    idx: 0, // Left Edge entity is always at index 0 in warpAndEdgeData
                    posType: 'edgeSys',
                    warpSysId: originalDotIndex // For left edge, originalDotIndex is the system level
                };
            }
            // Check Warp Core Dots
            else if (originalDotIndex < numLeftEdgeDots + numWarpCoreDots) {
                const adjustedIndex = originalDotIndex - numLeftEdgeDots;
                const warpVisualOrder = Math.floor(adjustedIndex / 2); // 0 for 1st warp, 1 for 2nd, etc.
                const isTop = adjustedIndex % 2 === 0;
                return {
                    idx: warpVisualOrder + 1, // Warps start at index 1 in warpAndEdgeData
                    posType: isTop ? 'topWeft' : 'bottomWeft'
                    // warpSysId is not applicable for warps
                };
            }
            // Must be Right Edge Dots
            else {
                const systemLevelOnRightEdge = originalDotIndex - (numLeftEdgeDots + numWarpCoreDots);
                return {
                    idx: effectiveNumWarps + 1, // Right Edge entity is at the last index
                    posType: 'edgeSys',
                    warpSysId: systemLevelOnRightEdge
                };
            }
        }

        // When toggling loop->tile on an edge dot with existing interactions,
        // assign subDot based on the approach direction so the Bezier snaps to
        // the correct tile dot and the fill renders on it.
        function assignSubDotsOnLoopToTile(entityIdx: number, sysLevel: number): void {
            const entity = canvasState.warpAndEdgeData[entityIdx];
            const edgeInteractions = entity.edgeSys[sysLevel];
            if (edgeInteractions.length === 0) return;

            // Build sorted list of all interactions with position metadata
            const allMeta: Array<{weft: number, sequence: number, posType: string}> = [];
            for (const e of canvasState.warpAndEdgeData) {
                if (e.type === 'warp') {
                    for (const a of e.topWeft) allMeta.push({weft: a.weft, sequence: a.sequence, posType: 'topWeft'});
                    for (const a of e.bottomWeft) allMeta.push({weft: a.weft, sequence: a.sequence, posType: 'bottomWeft'});
                } else if (e.type === 'edge') {
                    for (const sys of e.edgeSys) {
                        for (const a of sys) allMeta.push({weft: a.weft, sequence: a.sequence, posType: 'edgeSys'});
                    }
                }
            }
            allMeta.sort((a, b) => a.sequence - b.sequence);

            for (const interaction of edgeInteractions) {
                // Find the preceding interaction in this weft's path
                let prevPosType: string | null = null;
                for (const meta of allMeta) {
                    if (meta.weft === interaction.weft && meta.sequence < interaction.sequence) {
                        prevPosType = meta.posType;
                    }
                }

                // topWeft (yarn over) -> top dot, bottomWeft (yarn under) -> bottom dot
                if (prevPosType === 'bottomWeft') {
                    interaction.subDot = 'bottom';
                } else {
                    interaction.subDot = 'top';
                }
            }
        }

        // When toggling tile->loop, strip subDot from interactions
        function removeSubDotsOnTileToLoop(entityIdx: number, sysLevel: number): void {
            const entity = canvasState.warpAndEdgeData[entityIdx];
            for (const interaction of entity.edgeSys[sysLevel]) {
                delete interaction.subDot;
            }
        }

        function cycleWarpSystem(warpIndex: number) {
            const warpEntity = canvasState.warpAndEdgeData[warpIndex + 1]; // +1: index 0 is left edge
            if (!warpEntity || warpEntity.type !== 'warp') return;

            const currentLayer = warpEntity.warpLayer ?? warpEntity.warpSys;
            warpEntity.warpLayer = (currentLayer + 1) % activeWarpSystems;

            rebuildRenderCache();
            updateCallback(canvasState);
            p.redraw();
        }

        function generateUUID() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
    };
};
