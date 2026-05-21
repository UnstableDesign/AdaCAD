import { type Draft, type Operation, getOp, call, type OpInput, warps, wefts, initDraftWithParams } from "adacad-drafting-lib";
import { getRenderCount } from "./display";

export type OscillatorOptions = {
    /** Cycles per second. Default 0.25. */
    frequency?: number;
    /** Phase offset in radians. Default 0. */
    phase?: number;
};

/**
 * Sine oscillator mapped to the inclusive range [min, max].
 * Value advances with time so each sketch run can pick up a new sample.
 */
export function oscillator(
    min: number,
    max: number,
    options: OscillatorOptions = {}
): number {
    const frequency = options.frequency ?? 0.25;
    const phase = options.phase ?? 0;
    const t = performance.now() / 1000;
    const wave = Math.sin(2 * Math.PI * frequency * t + phase);
    const normalized = 0.5 + 0.5 * wave;
    return min + (max - min) * normalized;
}

/** Integer count of how many times `display()` has painted the canvas. */
export function renderCount(multiplier: number = 1): number {
    return getRenderCount() * multiplier;
}


/**wrap calls into cleaner coding format.  */

//STRUCTURES

export async function twill(raised: number, lowered: number, offset: number, binding: number): Promise<Draft> {
    const twillOp = getOp('twill') as Operation;
    const outputs = await call(twillOp, [raised, lowered, offset, binding]);
    return outputs[0].draft;
}

export async function satin(repeat: number, shift: number, facing: boolean): Promise<Draft> {
    const satinOp = getOp('satin') as Operation;
    const outputs = await call(satinOp, [repeat, shift, facing]);
    return outputs[0].draft;
}

export async function tabby(warps_raised: number, warps_lowered: number, base_pics: number, alt_pics: number): Promise<Draft> {
    const tabbyOp = getOp('tabby') as Operation;
    const outputs = await call(tabbyOp, [warps_raised, warps_lowered, base_pics, alt_pics]);
    return outputs[0].draft;
}

export async function waffle(float_length: number, binding_rows: number, packing_factor: number): Promise<Draft> {
    const waffleOp = getOp('waffle') as Operation;
    const outputs = await call(waffleOp, [float_length, binding_rows, packing_factor]);
    return outputs[0].draft;
}

export async function random(ends: number, pics: number, pcent: number): Promise<Draft> {
    const randomOp = getOp('random') as Operation;
    const outputs = await call(randomOp, [ends, pics, pcent]);
    return outputs[0].draft;
}

//MANIPULATIONS

export async function addColors(draft: Draft, weft_colors: number[], warp_colors: number[]): Promise<Draft> {
    const d = await initDraftWithParams({ warps: warps(draft.drawdown), wefts: wefts(draft.drawdown), drawdown: draft.drawdown, rowShuttleMapping: weft_colors, colShuttleMapping: warp_colors });
    return d;
}


export async function interlace(drafts: Draft[], repeats: boolean = false, weft_oriented: boolean = false): Promise<Draft> {
    const interlaceOp = (weft_oriented ? getOp('interlace_warps') : getOp('interlace')) as Operation;
    const draftInputs: Array<OpInput> = drafts.map(draft => ({ drafts: [draft], inlet_params: [], inlet_id: 0 }));
    const outputs = await call(interlaceOp, [repeats ? 1 : 0], draftInputs);
    return outputs[0].draft;
}

export async function shift(draft: Draft, shift_ends: number, shift_pics: number): Promise<Draft> {
    const shiftOp = getOp('shift') as Operation;
    const outputs = await call(shiftOp, [shift_ends, shift_pics], [{ drafts: [draft], inlet_params: [], inlet_id: 0 }]);
    return outputs[0].draft;
}

export async function symmetry(draft: Draft, options: number, remove_center: boolean = false): Promise<Draft> {
    const symmetryOp = getOp('makesymmetric') as Operation;
    const outputs = await call(symmetryOp, [options, remove_center ? 1 : 0], [{ drafts: [draft], inlet_params: [], inlet_id: 0 }]);
    return outputs[0].draft;
}

export async function stretch(draft: Draft, weft_stretch: number, warp_stretch: number): Promise<Draft> {
    const stretchOp = getOp('stretch') as Operation;
    const outputs = await call(stretchOp, [weft_stretch, warp_stretch], [{ drafts: [draft], inlet_params: [], inlet_id: 0 }]);
    return outputs[0].draft;
}


//CLOTH

export async function join(drafts: Array<Draft>, repeats: boolean = false): Promise<Draft> {
    const joinLeftOp = getOp('join_left') as Operation;
    const outputs = await call(joinLeftOp, [repeats ? 1 : 0], [{ drafts: drafts, inlet_params: [], inlet_id: 0 }]);
    return outputs[0].draft;
}


export async function tile(draft: Draft, warp_repeats: number = 2, weft_repeats: number = 2, mode: number = 0, offset: number = 50): Promise<Draft> {
    const tileOp = getOp('tile') as Operation;
    const outputs = await call(tileOp, [warp_repeats, weft_repeats, mode, offset], [{ drafts: [draft], inlet_params: [], inlet_id: 0 }]);
    return outputs[0].draft;
}

export async function resize(draft: Draft, width: number, height: number): Promise<Draft> {
    const rectangleOp = getOp('rectangle') as Operation;
    const outputs = await call(rectangleOp, [width, height], [{ drafts: [draft], inlet_params: [], inlet_id: 0 }]);
    return outputs[0].draft;
}

export async function fill(pattern: Draft, black_draft: Draft, white_draft: Draft): Promise<Draft> {
    const fillOp = getOp('fill') as Operation;
    const outputs = await call(fillOp, [], [{ drafts: [pattern], inlet_params: [], inlet_id: 0 }, { drafts: [black_draft], inlet_params: [], inlet_id: 1 }, { drafts: [white_draft], inlet_params: [], inlet_id: 2 }]);
    return outputs[0].draft;
}


