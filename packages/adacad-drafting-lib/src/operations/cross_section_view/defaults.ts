// Default weft colors and material IDs for the cross-section view.
// Matches AdaCAD's built-in material palette (IDs 2-10, skipping 0=black, 1=white).

import { interpolate } from '../../utils/utils';

export const DEFAULT_WEFT_COLORS = [
    '#d55e00', '#e69f00', '#f0e442', '#4aff4a', '#009e73',
    '#0072b2', '#56b4e9', '#cc79a7', '#aaaaaa'
];

export const DEFAULT_WEFT_MATERIAL_IDS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export const DEFAULT_WARP_DOT_COLOR = '#323232';

// Stroke weight range for weft Bezier curves (diameter-proportional)
export const DEFAULT_WEFT_STROKE_WEIGHT = 3;
export const MIN_WEFT_STROKE_WEIGHT = 1.5;
export const MAX_WEFT_STROKE_WEIGHT = 6;

// Dot size range for warp dots (diameter-proportional)
export const DEFAULT_WARP_DOT_SIZE = 22;
export const MIN_WARP_DOT_SIZE = 14;
export const MAX_WARP_DOT_SIZE = 22;

/**
 * Maps raw material diameters to visual stroke weights.
 * Returns one weight per weft (parallel to weftColors).
 * When all diameters are equal or empty, returns the default weight for all.
 */
export function computeStrokeWeights(diameters: number[]): number[] {
    if (diameters.length === 0) return [];
    const max = Math.max(...diameters);
    if (max <= 0) return diameters.map(() => DEFAULT_WEFT_STROKE_WEIGHT);
    const allEqual = diameters.every(d => d === diameters[0]);
    if (allEqual) return diameters.map(() => DEFAULT_WEFT_STROKE_WEIGHT);
    return diameters.map(d =>
        interpolate(d / max, { min: MIN_WEFT_STROKE_WEIGHT, max: MAX_WEFT_STROKE_WEIGHT })
    );
}

/**
 * Maps raw material diameters to visual warp dot sizes.
 * Returns one size per warp system (parallel to warpColors).
 * When all diameters are equal or empty, returns the default size for all.
 */
export function computeDotSizes(diameters: number[]): number[] {
    if (diameters.length === 0) return [];
    const max = Math.max(...diameters);
    if (max <= 0) return diameters.map(() => DEFAULT_WARP_DOT_SIZE);
    const allEqual = diameters.every(d => d === diameters[0]);
    if (allEqual) return diameters.map(() => DEFAULT_WARP_DOT_SIZE);
    return diameters.map(d =>
        interpolate(d / max, { min: MIN_WARP_DOT_SIZE, max: MAX_WARP_DOT_SIZE })
    );
}
