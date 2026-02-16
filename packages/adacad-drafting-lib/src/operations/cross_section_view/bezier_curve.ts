// BezierCurve Class - Handles Bezier curve calculations and rendering
interface BezierCurveConfig {
    p: any; 
    ACCESSIBLE_COLORS: string[];
}

export const createBezierCurve = (config: BezierCurveConfig) => {
    const p = config.p; 
    const ACCESSIBLE_COLORS = config.ACCESSIBLE_COLORS;

    const calculateBezierControlPoints = (anchors: any[], tension = 0.16666): void => {
        if (!anchors || anchors.length < 1) {
            return;
        }
        if (anchors.length === 1) {
            anchors[0].cpBefore = { ...anchors[0].pos };
            anchors[0].cpAfter = { ...anchors[0].pos };
            return;
        }
        const n = anchors.length;
        for (let i = 0; i < n; i++) {
            // Always use open spline logic for p0 and p2
            const p0 = anchors[Math.max(0, i - 1)].pos;
            const p1 = anchors[i].pos;
            const p2 = anchors[Math.min(n - 1, i + 1)].pos;

            if (i < n - 1) {
                anchors[i].cpAfter = {
                    x: p1.x + (p2.x - p0.x) * tension,
                    y: p1.y + (p2.y - p0.y) * tension,
                };
            } else { // Last point of an open spline
                anchors[i].cpAfter = { ...p1 };
            }

            if (i > 0) {
                anchors[i].cpBefore = {
                    x: p1.x - (p2.x - p0.x) * tension,
                    y: p1.y - (p2.y - p0.y) * tension,
                };
            } else { // First point of an open spline
                anchors[i].cpBefore = { ...p1 };
            }
        }
        // Special handling for endpoints of open splines
        if (n > 1) { // n is always > 1 here due to earlier checks
            anchors[0].cpBefore = { ...anchors[0].pos };
            anchors[0].cpAfter = {
                x: anchors[0].pos.x + (anchors[1].pos.x - anchors[0].pos.x) * tension * 2,
                y: anchors[0].pos.y + (anchors[1].pos.y - anchors[0].pos.y) * tension * 2
            };
            if (n === 2) {
                anchors[0].cpAfter = { x: anchors[0].pos.x + (anchors[1].pos.x - anchors[0].pos.x) * 0.333, y: anchors[0].pos.y + (anchors[1].pos.y - anchors[0].pos.y) * 0.333 };
            }
            anchors[n - 1].cpAfter = { ...anchors[n - 1].pos };
            anchors[n - 1].cpBefore = {
                x: anchors[n - 1].pos.x - (anchors[n - 1].pos.x - anchors[n - 2].pos.x) * tension * 2,
                y: anchors[n - 1].pos.y - (anchors[n - 1].pos.y - anchors[n - 2].pos.y) * tension * 2
            };
            if (n === 2) {
                anchors[n - 1].cpBefore = { x: anchors[n - 1].pos.x - (anchors[n - 1].pos.x - anchors[n - 2].pos.x) * 0.333, y: anchors[n - 1].pos.y - (anchors[n - 1].pos.y - anchors[n - 2].pos.y) * 0.333 };
            }
        }
    };

    const renderBezierPath = (pathAnchors: any[], pathWeftId: number): void => {
        if (!pathAnchors || pathAnchors.length < 2) {
            return; // Need at least two anchors to draw a segment
        }

        // p refers to the p5 instance
        p.strokeWeight(3);
        p.noFill();

        const baseWeftColor = p.color(ACCESSIBLE_COLORS[pathWeftId % ACCESSIBLE_COLORS.length]);
        p.colorMode(p.HSB, 360, 100, 100);
        const baseHue = p.hue(baseWeftColor);
        const baseSat = Math.min(p.saturation(baseWeftColor) * 1.25, 100);
        const baseBright = p.brightness(baseWeftColor) * 0.8;
        const startColor = p.color(baseHue, baseSat, baseBright);
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

                const pt_start_x = p.bezierPoint(p1.x, cp1_out.x, cp2_in.x, p2_pos.x, t_local0);
                const pt_start_y = p.bezierPoint(p1.y, cp1_out.y, cp2_in.y, p2_pos.y, t_local0);
                const pt_end_x = p.bezierPoint(p1.x, cp1_out.x, cp2_in.x, p2_pos.x, t_local1);
                const pt_end_y = p.bezierPoint(p1.y, cp1_out.y, cp2_in.y, p2_pos.y, t_local1);

                const t_avg_local = (t_local0 + t_local1) / 2;
                const globalProgress = pathAnchors.length > 1 ? (i + t_avg_local) / (pathAnchors.length - 1) : 1;

                const segmentColor = p.lerpColor(startColor, baseWeftColor, globalProgress);
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
