// P5 Canvas Sketch for Cross-Section View Operation
import { createDraft } from './draft';
import { createBezierCurve } from './bezier_curve';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 400;

interface CrossSectionViewSketchConfig {
    warpSystems: number;
    weftSystems: number;
    numWarps: number;
    canvasState: any;
    updateCallback: Function;
    loadCanvasState: Function;
}

export const createP5Sketch = (config: CrossSectionViewSketchConfig) => {
    const warpSystems = config.warpSystems;
    const weftSystems = config.weftSystems;
    const numWarps = config.numWarps;
    const updateCallback = config.updateCallback;
    const loadCanvasState = config.loadCanvasState;

    return (p: any) => {
        // Use whichever is smaller: numWarps or warpSystems. 
        // If numWarps is < warpSystems, you cant access all the warp systems.
        const activeWarpSystems = Math.min(numWarps, warpSystems);

        // -- Constants
        const ACCESSIBLE_COLORS = [
            "#F4A7B9", "#A7C7E7", "#C6E2E9", "#FAD6A5", "#D5AAFF", "#B0E57C",
            "#FFD700", "#FFB347", "#87CEFA", "#E6E6FA", "#FFE4E1", "#C1F0F6"
        ];
        const SKETCH_CANVAS_WIDTH = CANVAS_WIDTH;
        const SKETCH_CANVAS_HEIGHT = CANVAS_HEIGHT;
        const SKETCH_TOP_MARGIN = 60;
        const SKETCH_LEFT_MARGIN = 100;
        const SKETCH_RIGHT_MARGIN = 60;
        const SKETCH_BOTTOM_MARGIN = 20;
        const WEFT_ICON_SIZE = 36;
        const WEFT_ICON_FONT_SIZE = 24;
        const WARP_DOT_SIZE = 22;
        const WEFT_DOT_SIZE = 16;
        const WEFT_SPACING = 24;
        const RESET_BUTTON = { x: 30, y: 15, w: 60, h: 28 };

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
            generatedDraft: {
                rows: [],
                colSystemMapping: [],
                weftColors: []
            }
        };

        // Canvas State
        let { canvasState, needsReset } = loadCanvasState(DEFAULT_CANVAS_STATE);

        // Track wefts that have had dots deleted in the current session.
        // When adding new dots for an "edited" weft, the interaction is inserted
        // after the weft's existing interactions (preserving row position in the draft)
        // rather than appended at the end of the global sequence (which would create
        // an unwanted extra row).
        const editedWeftIds = new Set<number>();

        // Initialize helper classes
        const draftGenerator = createDraft({ weftSystems, ACCESSIBLE_COLORS });
        const bezierRenderer = createBezierCurve({ p, ACCESSIBLE_COLORS });

        function resetCanvas() {
            editedWeftIds.clear();
            canvasState = JSON.parse(JSON.stringify(DEFAULT_CANVAS_STATE));

            // Initialize dotFills to the correct size with empty arrays for each dot
            canvasState.dotFills = [];
            const currentTotalDots = (activeWarpSystems * 2) + (numWarps * 2);
            for (let i = 0; i < currentTotalDots; i++) {
                canvasState.dotFills.push([]);
            }

            // Left Edge Entity (index 0)
            const leftEdgeEntity: { type: string, edgeSys: any[][] } = { type: 'edge', edgeSys: [] };
            for (let i = 0; i < activeWarpSystems; i++) {
                leftEdgeEntity.edgeSys.push([]);
            }
            canvasState.warpAndEdgeData.push(leftEdgeEntity);

            // Warp Entities (indices 1 to numWarps)
            for (let i = 0; i < numWarps; i++) {
                canvasState.warpAndEdgeData.push({
                    type: 'warp',
                    warpSys: i % activeWarpSystems,
                    topWeft: [],
                    bottomWeft: []
                });
            }

            // Right Edge Entity (index numWarps + 1)
            const rightEdgeEntity: { type: string, edgeSys: any[][] } = { type: 'edge', edgeSys: [] };
            for (let i = 0; i < activeWarpSystems; i++) {
                rightEdgeEntity.edgeSys.push([]);
            }
            canvasState.warpAndEdgeData.push(rightEdgeEntity);

            // Initialize generatedDraft to a blank state based on current params
            draftGenerator.generate(canvasState, numWarps, activeWarpSystems);


            // Report the new canvasState to the operation
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
                // File restore, draw restored state
                p.redraw();
            }

            p.noLoop();
        };

        p.draw = function draw() {
            p.background(255);
            drawWeftSysIcons();
            drawLines();
            drawWarpDots();
            drawSplines();
            drawWeftDots();
            drawStickyLineToMouse();
            drawDeleteButton();
            drawResetButton();
        };

        function drawLines() {
            const numColumns = numWarps + 2; // Left Edge, Warps, Right Edge

            const firstColumnX = SKETCH_LEFT_MARGIN;
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const drawingWidth = lastColumnX - firstColumnX;

            let spacingX = 0;
            if (numColumns > 1) {
                spacingX = drawingWidth / (numColumns - 1);
            }

            let spacingY = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (activeWarpSystems + 1);
            canvasState.weftDots = [];

            let currentX;

            // --- Populate Left Edge Interaction Dot Positions ---
            currentX = firstColumnX;
            for (let sys = 0; sys < activeWarpSystems; sys++) {
                let y = SKETCH_TOP_MARGIN + spacingY * (sys + 1);
                canvasState.weftDots.push({ x: currentX, y: y });
            }

            // --- Draw Warp Lines & Populate Warp Interaction Dot Positions ---
            for (let i = 0; i < numWarps; i++) {
                currentX = firstColumnX + spacingX * (i + 1);

                p.stroke(0);
                p.strokeWeight(1);
                p.line(currentX, SKETCH_TOP_MARGIN, currentX, SKETCH_CANVAS_HEIGHT - SKETCH_BOTTOM_MARGIN);

                const warpEntityData = canvasState.warpAndEdgeData[i + 1];
                let warpCenterY = SKETCH_TOP_MARGIN + spacingY * ((warpEntityData.warpSys % activeWarpSystems) + 1);

                canvasState.weftDots.push({ x: currentX, y: warpCenterY - WEFT_SPACING }); // Top weft dot
                canvasState.weftDots.push({ x: currentX, y: warpCenterY + WEFT_SPACING }); // Bottom weft dot
            }

            // --- Populate Right Edge Interaction Dot Positions ---
            currentX = lastColumnX;
            if (numColumns <= 1) currentX = firstColumnX;
            for (let sys = 0; sys < activeWarpSystems; sys++) {
                let y = SKETCH_TOP_MARGIN + spacingY * (sys + 1);
                canvasState.weftDots.push({ x: currentX, y: y });
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
            const numColumns = numWarps + 2;
            const firstColumnX = SKETCH_LEFT_MARGIN;
            const lastColumnX = SKETCH_CANVAS_WIDTH - SKETCH_RIGHT_MARGIN;
            const drawingWidth = lastColumnX - firstColumnX;

            let spacingX = 0;
            if (numColumns > 1) {
                spacingX = drawingWidth / (numColumns - 1);
            }
            let spacingY = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (activeWarpSystems + 1);

            for (let i = 0; i < numWarps; i++) {
                let currentX = firstColumnX + spacingX * (i + 1);
                const warpEntityData = canvasState.warpAndEdgeData[i + 1];
                if (warpEntityData && warpEntityData.type === 'warp') {
                    let warpCenterY = SKETCH_TOP_MARGIN + spacingY * ((warpEntityData.warpSys % activeWarpSystems) + 1);
                    p.noStroke();
                    p.fill(50);
                    p.ellipse(currentX, warpCenterY, WARP_DOT_SIZE, WARP_DOT_SIZE);
                }
            }
        }

        function drawWeftSysIcons() {
            let spacing = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (weftSystems + 1);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            for (let i = 0; i < weftSystems; i++) {
                let y = SKETCH_TOP_MARGIN + spacing * (i + 1);
                let weftColor = ACCESSIBLE_COLORS[i % ACCESSIBLE_COLORS.length];

                p.fill(weftColor);
                p.stroke(canvasState.activeWeft === i ? 80 : 200);
                p.strokeWeight(canvasState.activeWeft === i ? 2 : 1);
                p.ellipse(SKETCH_LEFT_MARGIN * 0.4, y, WEFT_ICON_SIZE, WEFT_ICON_SIZE);

                p.fill(0);
                p.noStroke();
                p.textSize(WEFT_ICON_FONT_SIZE);
                p.text(String.fromCharCode(97 + i), SKETCH_LEFT_MARGIN * 0.4, y);
            }
        }

        function drawSplines() {
            for (const weftIdStr in canvasState.pathsByWeft) {
                const weftId = parseInt(weftIdStr, 10);
                const anchors = canvasState.pathsByWeft[weftId];

                if (anchors && anchors.length >= 2) {
                    try {
                        bezierRenderer.calculateBezierControlPoints(anchors);
                    } catch (e) {
                        console.error('[CrossSectionView] Error calling calculateBezierControlPoints in draw:', e);
                        console.error('Path data that caused error:', JSON.parse(JSON.stringify({ weftId, anchors })));
                        p.noLoop(); // Stop looping if this error occurs
                        return;
                    }
                    bezierRenderer.renderBezierPath(anchors, weftId);
                }
            }
        }

        function drawWeftDots() {
            for (let i = 0; i < canvasState.weftDots.length; i++) {
                let dot = canvasState.weftDots[i];

                if (canvasState.selectedDots.includes(i) && canvasState.dotFills[i].length > 0) {
                    p.fill(ACCESSIBLE_COLORS[canvasState.dotFills[i][0] % ACCESSIBLE_COLORS.length]);
                    p.stroke(0);
                } else {
                    p.fill(255);
                    p.stroke(180);
                }
                p.strokeWeight(1);
                p.ellipse(dot.x, dot.y, WEFT_DOT_SIZE, WEFT_DOT_SIZE);

                for (let r = 1; r < canvasState.dotFills[i].length; r++) {
                    p.noFill();
                    p.stroke(ACCESSIBLE_COLORS[canvasState.dotFills[i][r] % ACCESSIBLE_COLORS.length]);
                    p.strokeWeight(2);
                    p.ellipse(dot.x, dot.y, WEFT_DOT_SIZE + r * 4, WEFT_DOT_SIZE + r * 4);
                }
            }
        }

        function drawStickyLineToMouse() {
            if (canvasState.activeWeft !== null) {
                const activePathAnchors = canvasState.pathsByWeft[canvasState.activeWeft];
                if (activePathAnchors && activePathAnchors.length > 0) {
                    const activeWeftColorHex = ACCESSIBLE_COLORS[canvasState.activeWeft % ACCESSIBLE_COLORS.length];
                    const lastAnchorPos = activePathAnchors[activePathAnchors.length - 1].pos;
                    p.stroke(activeWeftColorHex);
                    p.strokeWeight(2);
                    p.line(lastAnchorPos.x, lastAnchorPos.y, p.mouseX, p.mouseY);
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
            p.text('Reset', RESET_BUTTON.x + RESET_BUTTON.w / 2, RESET_BUTTON.y + RESET_BUTTON.h / 2);
        }

        function isInsideResetButton(mx: number, my: number): boolean {
            return mx >= RESET_BUTTON.x && mx <= RESET_BUTTON.x + RESET_BUTTON.w &&
                   my >= RESET_BUTTON.y && my <= RESET_BUTTON.y + RESET_BUTTON.h;
        }

        p.mouseMoved = function mouseMoved() {
            let previousHoveredDot = canvasState.hoveredDotIndex;
            let previousShowDelete = canvasState.showDeleteButton;

            // Check if hovering over the reset button
            if (isInsideResetButton(p.mouseX, p.mouseY)) {
                p.cursor(p.HAND);
                return;
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
            canvasState.showDeleteButton = false;
            canvasState.deleteButtonBounds = null;

            // Check if hovering over any dot
            for (let i = 0; i < canvasState.weftDots.length; i++) {
                let dot = canvasState.weftDots[i];
                if (p.dist(p.mouseX, p.mouseY, dot.x, dot.y) < WEFT_DOT_SIZE) {
                    canvasState.hoveredDotIndex = i;

                    // Only show delete button if:
                    // 1. No active weft is selected (not actively drawing)
                    // 2. The dot has at least one weft assigned
                    if (canvasState.activeWeft === null && canvasState.dotFills[i].length > 0) {
                        canvasState.showDeleteButton = true;
                        // Position delete button to the top-right of the dot
                        canvasState.deleteButtonBounds = {
                            x: dot.x + 8,
                            y: dot.y - 18,
                            w: 16,
                            h: 16
                        };
                    }
                    break;
                }
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
                resetCanvas();
                return;
            }

            let clickedDotInfo: { index: number, pos: { x: number, y: number } } | null = null;
            let clicked = false;
            let spacing = (SKETCH_CANVAS_HEIGHT - SKETCH_TOP_MARGIN - SKETCH_BOTTOM_MARGIN) / (weftSystems + 1);

            // Check weft system clicks
            for (let i = 0; i < weftSystems; i++) {
                let y = SKETCH_TOP_MARGIN + spacing * (i + 1);
                if (p.dist(p.mouseX, p.mouseY, SKETCH_LEFT_MARGIN * 0.4, y) < WEFT_ICON_SIZE) {
                    const clickedWeftId = i;
                    if (canvasState.activeWeft === clickedWeftId) {
                        // User clicked the same active weft button (to deselect/complete open path)
                        editedWeftIds.delete(clickedWeftId);
                        canvasState.activeWeft = null;
                        p.noLoop();
                    } else {
                        // User clicked a new weft button or re-selected one.
                        // If there was an active path for a *different* weft, finalize it first.
                        if (canvasState.activeWeft !== null) {
                            editedWeftIds.delete(canvasState.activeWeft);
                        }
                        canvasState.activeWeft = clickedWeftId;
                        if (!canvasState.pathsByWeft[clickedWeftId]) {
                            canvasState.pathsByWeft[clickedWeftId] = [];
                        }
                        p.loop();
                    }
                    clicked = true;
                    p.redraw();
                    draftGenerator.generate(canvasState, numWarps, activeWarpSystems);
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
                        // Remove from dotFills
                        const weftToRemove = mostRecentWeft;
                        const weftIndex = canvasState.dotFills[dotIdx].indexOf(weftToRemove);
                        if (weftIndex !== -1) {
                            canvasState.dotFills[dotIdx].splice(weftIndex, 1);
                        }

                        if (canvasState.dotFills[dotIdx].length === 0) {
                            canvasState.dotFills[dotIdx] = [];
                            canvasState.selectedDots = canvasState.selectedDots.filter((idx: number) => idx !== dotIdx);
                        }

                        // Remove from warpAndEdgeData
                        const removedSequence = weftArray[mostRecentIndex].sequence;
                        weftArray.splice(mostRecentIndex, 1);
                        updateSequenceNumbers(removedSequence);

                        // Mark this weft as "edited" so future additions insert at the
                        // correct sequence position instead of appending at the end
                        editedWeftIds.add(weftToRemove);

                        // Update splines by removing anchors associated with the deleted dot
                        const weftOfPathToUpdate = weftToRemove;
                        if (canvasState.pathsByWeft[weftOfPathToUpdate]) {
                            let currentAnchorsForWeft = canvasState.pathsByWeft[weftOfPathToUpdate];
                            const updatedAnchors = currentAnchorsForWeft.filter((anchor: any) => anchor.dotIdx !== dotIdx);

                            if (updatedAnchors.length === 0) {
                                canvasState.pathsByWeft[weftOfPathToUpdate] = [];
                            } else if (updatedAnchors.length > 0 && updatedAnchors.length < 2) {
                                // Path is too short to be a Bezier curve, but still has a point
                                canvasState.pathsByWeft[weftOfPathToUpdate] = updatedAnchors;
                            } else {
                                bezierRenderer.calculateBezierControlPoints(updatedAnchors); // Recalculate CPs for the modified path
                                canvasState.pathsByWeft[weftOfPathToUpdate] = updatedAnchors;
                            }
                        }
                    }

                    canvasState.showDeleteButton = false;
                    canvasState.hoveredDotIndex = -1;
                    canvasState.deleteButtonBounds = null;

                    p.redraw();
                    draftGenerator.generate(canvasState, numWarps, activeWarpSystems);
                    // Report the new canvasState to the operation
                    updateCallback(canvasState);
                    return;
                }
            }

            // Check dot clicks
            if (canvasState.activeWeft !== null) {
                for (let i = 0; i < canvasState.weftDots.length; i++) {
                    let dot = canvasState.weftDots[i];
                    if (p.dist(p.mouseX, p.mouseY, dot.x, dot.y) < WEFT_DOT_SIZE) {
                        clickedDotInfo = { index: i, pos: dot };
                        break;
                    }
                }
            }

            if (clickedDotInfo && canvasState.activeWeft !== null) {
                const dotIndex = clickedDotInfo.index;
                const dotPosition = clickedDotInfo.pos;

                // --- Update Weave Structure ---
                const { idx, posType, warpSysId } = getDotInfo(dotIndex);
                let weftArray;
                const targetEntity = canvasState.warpAndEdgeData[idx];
                if (posType === 'edgeSys' && warpSysId !== undefined) {
                    weftArray = targetEntity.edgeSys[warpSysId];
                } else { // 'topWeft' or 'bottomWeft'
                    weftArray = targetEntity[posType];
                }

                // ALWAYS PUSH INTERACTION TO warpAndEdgeData for draft sequence
                // For edited wefts, this inserts at the correct position in the
                // global sequence (after the weft's existing interactions).
                // For non-edited wefts, appends at the end (normal behavior).
                const newSequence = getSequenceForNewInteraction(canvasState.activeWeft);
                weftArray.push({
                    weft: canvasState.activeWeft,
                    sequence: newSequence
                });
                // dotFills must stay in sync with warpAndEdgeData (a weft can visit the same dot multiple times)
                if (!canvasState.selectedDots.includes(dotIndex)) {
                    canvasState.selectedDots.push(dotIndex);
                }
                canvasState.dotFills[dotIndex].push(canvasState.activeWeft);

                // --- Spline Logic: Add anchor ---
                if (canvasState.activeWeft !== null) {
                    if (!canvasState.pathsByWeft[canvasState.activeWeft]) {
                        canvasState.pathsByWeft[canvasState.activeWeft] = [];
                    }
                    const currentActivePath = canvasState.pathsByWeft[canvasState.activeWeft];
                    const newAnchor = {
                        id: generateUUID(),
                        dotIdx: dotIndex,
                        pos: { x: dotPosition.x, y: dotPosition.y },
                        cpBefore: { x: dotPosition.x, y: dotPosition.y },
                        cpAfter: { x: dotPosition.x, y: dotPosition.y }
                    };

                    // Only add new anchor to spline if it's visually a new point or the first point
                    if (currentActivePath.length === 0 || currentActivePath[currentActivePath.length - 1].dotIdx !== newAnchor.dotIdx) {
                        currentActivePath.push(newAnchor);
                    }
                }

                // Ensure draw loop is running for sticky line if path not closed
                if (canvasState.activeWeft !== null) {
                    p.loop();
                }

                p.redraw();
                draftGenerator.generate(canvasState, numWarps, activeWarpSystems);
                updateCallback(canvasState);
                return;
            }

            // Clicks outside of any dots (if an active weft is selected)
            if (!clicked && canvasState.activeWeft !== null) {
                editedWeftIds.delete(canvasState.activeWeft);
                canvasState.activeWeft = null;
                p.noLoop();
                p.redraw();
                draftGenerator.generate(canvasState, numWarps, activeWarpSystems);
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
            const numWarpCoreDots = numWarps * 2;

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
                    idx: numWarps + 1, // Right Edge entity is at the last index
                    posType: 'edgeSys',
                    warpSysId: systemLevelOnRightEdge
                };
            }
        }

        function generateUUID() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
    };
};
