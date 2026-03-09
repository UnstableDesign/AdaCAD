// Bezier curve control point calculation and rendering for cross-section weft paths
import { DEFAULT_WEFT_STROKE_WEIGHT } from './defaults';

interface BezierCurveConfig {
    p: any;
    weftColors: string[];
    weftStrokeWeights: number[];
}

const OVERLAP_SPACING = 4;

// Pure geometry - no rendering dependency
const calculateBezierControlPoints = (anchors: any[], tension = 0.33): void => {
    if (!anchors || anchors.length < 1) {
        return;
    }
    if (anchors.length === 1) {
        anchors[0].cpBefore = { ...anchors[0].pos };
        anchors[0].cpAfter = { ...anchors[0].pos };
        return;
    }
    const n = anchors.length;

    // Outward bulge must clear the warp dot (radius 11px) with visible margin
    const MIN_WRAP_ARM = 35;
    // Turns sharper than ~60deg get wrap treatment (sqrt ramp to full at 180deg)
    const SHARP_ONSET = 0.5;

    for (let i = 0; i < n; i++) {
        const p0 = anchors[Math.max(0, i - 1)].pos;
        const p1 = anchors[i].pos;
        const p2 = anchors[Math.min(n - 1, i + 1)].pos;

        const tx = p2.x - p0.x;
        const ty = p2.y - p0.y;
        const tangentLen = Math.sqrt(tx * tx + ty * ty);

        if (tangentLen < 0.001) {
            anchors[i].cpBefore = { ...p1 };
            anchors[i].cpAfter = { ...p1 };
            continue;
        }

        // Catmull-Rom unit tangent
        const ux = tx / tangentLen;
        const uy = ty / tangentLen;

        const distPrev = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
        const distNext = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

        let afterUx = ux, afterUy = uy;
        let beforeUx = ux, beforeUy = uy;
        let afterArmLen = distNext * tension;
        let beforeArmLen = distPrev * tension;

        // At sharp turns, steer the wrap-side control arm toward the
        // outward perpendicular of the wrap segment so the curve visually
        // wraps around the warp dot instead of cutting through it.
        if (distPrev > 0.001 && distNext > 0.001) {
            const inDx = (p1.x - p0.x) / distPrev;
            const inDy = (p1.y - p0.y) / distPrev;
            const outDx = (p2.x - p1.x) / distNext;
            const outDy = (p2.y - p1.y) / distNext;
            const cosAngle = inDx * outDx + inDy * outDy;

            if (cosAngle < SHARP_ONSET) {
                const sharpness = Math.sqrt((SHARP_ONSET - cosAngle) / (SHARP_ONSET + 1.0));
                const shortIsNext = distNext <= distPrev;

                // Perpendicular to the wrap (short) segment
                const segDx = shortIsNext ? outDx : inDx;
                const segDy = shortIsNext ? outDy : inDy;
                let perpX = -segDy;
                let perpY = segDx;

                // Point outward: away from the approach (long) side
                const farX = shortIsNext ? (p0.x - p1.x) : (p2.x - p1.x);
                const farY = shortIsNext ? (p0.y - p1.y) : (p2.y - p1.y);
                if (perpX * farX + perpY * farY > 0) {
                    perpX = -perpX;
                    perpY = -perpY;
                }

                if (shortIsNext) {
                    // cpAfter faces the wrap -- blend toward outward perp
                    afterUx = ux + (perpX - ux) * sharpness;
                    afterUy = uy + (perpY - uy) * sharpness;
                    const len = Math.sqrt(afterUx * afterUx + afterUy * afterUy);
                    if (len > 0.001) { afterUx /= len; afterUy /= len; }
                    afterArmLen = Math.max(afterArmLen, MIN_WRAP_ARM);
                } else {
                    // cpBefore faces the wrap -- negate perp because
                    // cpBefore = p1 - dir * arm (negation pushes outward)
                    const wrapDx = -perpX;
                    const wrapDy = -perpY;
                    beforeUx = ux + (wrapDx - ux) * sharpness;
                    beforeUy = uy + (wrapDy - uy) * sharpness;
                    const len = Math.sqrt(beforeUx * beforeUx + beforeUy * beforeUy);
                    if (len > 0.001) { beforeUx /= len; beforeUy /= len; }
                    beforeArmLen = Math.max(beforeArmLen, MIN_WRAP_ARM);
                }
            }
        }

        if (i < n - 1) {
            anchors[i].cpAfter = {
                x: p1.x + afterUx * afterArmLen,
                y: p1.y + afterUy * afterArmLen,
            };
        } else {
            anchors[i].cpAfter = { ...p1 };
        }

        if (i > 0) {
            anchors[i].cpBefore = {
                x: p1.x - beforeUx * beforeArmLen,
                y: p1.y - beforeUy * beforeArmLen,
            };
        } else {
            anchors[i].cpBefore = { ...p1 };
        }
    }

    // Endpoint handling for open splines
    if (n > 1) {
        anchors[0].cpBefore = { ...anchors[0].pos };
        anchors[0].cpAfter = {
            x: anchors[0].pos.x + (anchors[1].pos.x - anchors[0].pos.x) * tension,
            y: anchors[0].pos.y + (anchors[1].pos.y - anchors[0].pos.y) * tension,
        };

        anchors[n - 1].cpAfter = { ...anchors[n - 1].pos };
        anchors[n - 1].cpBefore = {
            x: anchors[n - 1].pos.x - (anchors[n - 1].pos.x - anchors[n - 2].pos.x) * tension,
            y: anchors[n - 1].pos.y - (anchors[n - 1].pos.y - anchors[n - 2].pos.y) * tension,
        };
    }
};

export const createBezierCurve = (config: BezierCurveConfig) => {
    const p = config.p;
    const weftColors = config.weftColors;
    const weftStrokeWeights = config.weftStrokeWeights;

    const renderBezierPath = (pathAnchors: any[], pathWeftId: number, segmentOverlaps?: Array<{position: number, total: number, flipNormal: boolean}>): void => {
        if (!pathAnchors || pathAnchors.length < 2) {
            return; // Need at least two anchors to draw a segment
        }

        // p refers to the p5 instance
        const weight = weftStrokeWeights.length > 0
            ? (weftStrokeWeights[pathWeftId % weftStrokeWeights.length] ?? DEFAULT_WEFT_STROKE_WEIGHT)
            : DEFAULT_WEFT_STROKE_WEIGHT;
        p.strokeWeight(weight);
        p.noFill();

        const baseWeftColor = p.color(weftColors[pathWeftId % weftColors.length]);
        p.colorMode(p.HSB, 360, 100, 100);
        const baseHue = p.hue(baseWeftColor);
        const baseSat = p.saturation(baseWeftColor);
        const baseBright = p.brightness(baseWeftColor);
        // Darker start, lighter end -- luminance shift visible on any base color
        const startColor = p.color(baseHue, Math.min(baseSat * 1.3, 100), baseBright * 0.55);
        const endColor = p.color(baseHue, baseSat * 0.6, Math.min(baseBright * 1.4, 100));
        p.colorMode(p.RGB, 255);

        const numSubdivisionsPerMainSegment = 15;

        for (let i = 0; i < pathAnchors.length - 1; i++) {
            const anchor1 = pathAnchors[i];
            const anchor2 = pathAnchors[i + 1];

            const p1 = anchor1.pos;
            const cp1_out = anchor1.cpAfter;
            const cp2_in = anchor2.cpBefore;
            const p2_pos = anchor2.pos;

            for (let k = 0; k < numSubdivisionsPerMainSegment; k++) {
                const t_local0 = k / numSubdivisionsPerMainSegment;
                const t_local1 = (k + 1) / numSubdivisionsPerMainSegment;

                let pt_start_x = p.bezierPoint(p1.x, cp1_out.x, cp2_in.x, p2_pos.x, t_local0);
                let pt_start_y = p.bezierPoint(p1.y, cp1_out.y, cp2_in.y, p2_pos.y, t_local0);
                let pt_end_x = p.bezierPoint(p1.x, cp1_out.x, cp2_in.x, p2_pos.x, t_local1);
                let pt_end_y = p.bezierPoint(p1.y, cp1_out.y, cp2_in.y, p2_pos.y, t_local1);

                // Apply perpendicular offset for overlapping weft curves
                if (segmentOverlaps && segmentOverlaps[i] && segmentOverlaps[i].total > 1) {
                    const dx = pt_end_x - pt_start_x;
                    const dy = pt_end_y - pt_start_y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    if (len > 0) {
                        let nx = -dy / len;
                        let ny = dx / len;
                        // Ensure consistent normal direction regardless of traversal direction.
                        // Wefts traveling in opposite directions through the same segment would
                        // otherwise compute opposite normals, causing both to shift the same way.
                        if (segmentOverlaps[i].flipNormal) {
                            nx = -nx;
                            ny = -ny;
                        }
                        const offset = (segmentOverlaps[i].position - (segmentOverlaps[i].total - 1) / 2) * OVERLAP_SPACING;
                        pt_start_x += nx * offset;
                        pt_start_y += ny * offset;
                        pt_end_x += nx * offset;
                        pt_end_y += ny * offset;
                    }
                }

                const t_avg_local = (t_local0 + t_local1) / 2;
                const globalProgress = (i + t_avg_local) / (pathAnchors.length - 1);

                const segmentColor = p.lerpColor(startColor, endColor, globalProgress);
                p.stroke(segmentColor);
                p.line(pt_start_x, pt_start_y, pt_end_x, pt_end_y);
            }
        }
    };

    return {
        calculateBezierControlPoints,
        renderBezierPath,
    };
};
