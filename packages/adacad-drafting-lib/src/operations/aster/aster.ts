import { initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps, wefts, getCellValue, Drawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getInputDraft, getOpParamValById, getAllDraftsAtInlet, parseDraftNames } from "../../operations";
import { NumParam, SelectParam, BoolParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta, OpOutput } from "../types";
import { clothOp } from "../categories";
import { defaults } from "../../utils";

const name = "aster";

const meta: OpMeta = {
    displayname: 'aster',
    desc: 'Draws an aster flower made of blocks, where each block is one repeat of the input structure. The center holds the structure as it is. The petals hold the structure stretched in the direction of the petal, so the north and south petals make long warp floats and the east and west petals make long weft floats. Corner petals add one more strip of each stretch in the notches between petals, laid on top of each other where they cross. Cells outside the flower are left unset.',
    img: 'aster.png',
    categories: [clothOp]
};

const RECTANGLE = 0;
const DIAMOND = 1;

//PARAMS
const center_type: SelectParam = {
    name: 'center type',
    type: 'select',
    selectlist: [
        { name: 'rectangle', value: RECTANGLE },
        { name: 'diamond', value: DIAMOND }
    ],
    value: RECTANGLE,
    dx: 'the shape of the flower center. Use equal width and height for a square'
};

const center_width: NumParam = {
    name: 'center width',
    type: 'number',
    min: 1,
    max: 100,
    value: 3,
    dx: 'the width of the center in blocks (one block is one repeat of the structure). For a diamond, the size across'
};

const center_height: NumParam = {
    name: 'center height',
    type: 'number',
    min: 1,
    max: 100,
    value: 3,
    dx: 'the height of the center in blocks. Not used by the diamond'
};

const petal_length: NumParam = {
    name: 'petal length',
    type: 'number',
    min: 1,
    max: 100,
    value: 3,
    dx: 'the length of each petal in blocks. The structure in each petal is stretched by this amount (1 = no stretch)'
};

const corner_petal: BoolParam = {
    name: 'corner petal',
    type: 'boolean',
    falsestate: 'no corner petals',
    truestate: 'add corner petals',
    value: 0,
    dx: 'fills the corners between petals with both stretches laid on top of each other. For a rectangle, adds a vertical and a horizontal strip in each corner. For a diamond, fills the notches on the outer edge where two petals meet on a diagonal'
};

const params = [center_type, center_width, center_height, petal_length, corner_petal];

//INLETS
const structure_inlet: OperationInlet = {
    name: 'structure',
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the structure that fills each block of the flower',
    num_drafts: 1
}

const inlets = [structure_inlet];


type CellVal = boolean | null;

// Raised if either is raised; unset only when both are unset
const orCells = (a: CellVal, b: CellVal): CellVal => {
    if (a === true || b === true) return true;
    if (a === false || b === false) return false;
    return null;
}

const toSequenceVal = (v: CellVal): number => {
    if (v === null) return 2;
    return v ? 1 : 0;
}

// Non-negative remainder; diamond band diagonals can index before their petal's start
const mod = (a: number, n: number): number => ((a % n) + n) % n;

// Reads the structure as an endlessly repeating tile
const makeReader = (dd: Drawdown) => {
    const sh = wefts(dd);
    const sw = warps(dd);
    return (i: number, j: number): CellVal => getCellValue(dd[mod(i, sh)][mod(j, sw)]);
}

/**
 * Rectangle flowers: a full-width cross of petals around an nw x nh center.
 * Each petal counts its cells from its own start, so every petal holds exactly one
 * stretched repeat of the structure.
 */
const rectangle = (dd: Drawdown, nw: number, nh: number, L: number, corner: boolean): Array<Array<CellVal>> => {
    const sh = wefts(dd);
    const sw = warps(dd);
    const at = makeReader(dd);

    const rows = (nh + 2 * L) * sh;
    const cols = (nw + 2 * L) * sw;
    const c0r = L * sh, c1r = (L + nh) * sh;
    const c0c = L * sw, c1c = (L + nw) * sw;

    const grid: Array<Array<CellVal>> = [];
    for (let r = 0; r < rows; r++) {
        const row: Array<CellVal> = [];
        for (let c = 0; c < cols; c++) {
            const in_rows = r >= c0r && r < c1r;
            const in_cols = c >= c0c && c < c1c;
            const rl = (r >= c1r) ? r - c1r : r;
            const cl = (c >= c1c) ? c - c1c : c;
            const vert = at(Math.floor(rl / L), c);
            const horiz = at(r, Math.floor(cl / L));

            let val: CellVal = null;
            if (in_rows && in_cols) val = at(r, c);
            else if (in_cols) val = vert;
            else if (in_rows) val = horiz;
            else if (corner) {
                // section distance from the center edge, 1 = next to it
                const dr = (r < c0r) ? Math.floor((c0r - r - 1) / sh) + 1 : Math.floor((r - c1r) / sh) + 1;
                const dc = (c < c0c) ? Math.floor((c0c - c - 1) / sw) + 1 : Math.floor((c - c1c) / sw) + 1;
                if (dr === 1 && dc === 1) val = orCells(vert, horiz);
                else if (dc === 1) val = vert;
                else if (dr === 1) val = horiz;
            }
            row.push(val);
        }
        grid.push(row);
    }
    return grid;
}

/**
 * Diamond flowers: a stepped diamond w sections across, wrapped in a band of L sections.
 * Band cells take the stretch of the nearer axis. Exact diagonals take both, except on the
 * outer edge, where they appear only as corner petals.
 * Doubled section coordinates keep even widths on whole numbers.
 */
const diamond = (dd: Drawdown, w: number, L: number, corner: boolean): Array<Array<CellVal>> => {
    const sh = wefts(dd);
    const sw = warps(dd);
    const at = makeReader(dd);

    const k = Math.floor(w / 2);
    const span = w + 2 * L;
    const mid2 = span - 1;

    const grid: Array<Array<CellVal>> = [];
    for (let r = 0; r < span * sh; r++) {
        const row: Array<CellVal> = [];
        for (let c = 0; c < span * sw; c++) {
            const dR = 2 * Math.floor(r / sh) - mid2;
            const dC = 2 * Math.floor(c / sw) - mid2;
            const d = (Math.abs(dR) + Math.abs(dC)) / 2;

            let val: CellVal = null;
            if (d <= k) {
                val = at(r, c);
            } else if (d <= k + L) {
                const rl = (dR > 0) ? r - (span - L) * sh : r;
                const cl = (dC > 0) ? c - (span - L) * sw : c;
                const vert = at(Math.floor(rl / L), c);
                const horiz = at(r, Math.floor(cl / L));
                if (Math.abs(dR) > Math.abs(dC)) val = vert;
                else if (Math.abs(dC) > Math.abs(dR)) val = horiz;
                // Diagonals overlap except on the outer edge, where they are corner petals.
                // The ring touching the diamond corner to corner (depth 1 or 2, by width parity) always stays.
                else if (d - k <= 2 || d < k + L || corner) val = orCells(vert, horiz);
            }
            row.push(val);
        }
        grid.push(row);
    }
    return grid;
}

// Output size in ends x picks, matching the grids built above
const outputSize = (type: number, w: number, h: number, L: number, sw: number, sh: number): { cols: number, rows: number } => {
    if (type === DIAMOND) return { cols: (w + 2 * L) * sw, rows: (w + 2 * L) * sh };
    return { cols: (w + 2 * L) * sw, rows: (h + 2 * L) * sh };
}


const perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): Promise<Array<OpOutput>> => {

    const input_draft = getInputDraft(op_inputs);
    if (input_draft == null) return Promise.resolve([]);

    const type = <number>getOpParamValById(0, op_params);
    const width = <number>getOpParamValById(1, op_params);
    const height = <number>getOpParamValById(2, op_params);
    const L = <number>getOpParamValById(3, op_params);
    const corner = <number>getOpParamValById(4, op_params) === 1;

    const dd = input_draft.drawdown;
    let grid: Array<Array<CellVal>>;
    if (type === DIAMOND) grid = diamond(dd, width, L, corner);
    else grid = rectangle(dd, width, height, L, corner);

    const pattern = new Sequence.TwoD();
    grid.forEach(row => {
        const seq = new Sequence.OneD();
        row.forEach(v => seq.push(toSequenceVal(v)));
        pattern.pushWeftSequence(seq.val());
    });

    let d = initDraftFromDrawdown(pattern.export());
    // one output pick crosses several structure picks, so systems and materials follow the center
    d = updateWeftSystemsAndShuttles(d, input_draft);
    d = updateWarpSystemsAndShuttles(d, input_draft);

    return Promise.resolve([{ draft: d }]);
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>): string => {
    const drafts = getAllDraftsAtInlet(op_inputs, 0);
    return 'aster(' + parseDraftNames(drafts) + ')';
}

const sizeCheck = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>): boolean => {
    const input_draft = getInputDraft(op_inputs);
    if (input_draft == null) return true;

    const size = outputSize(
        <number>getOpParamValById(0, op_params),
        <number>getOpParamValById(1, op_params),
        <number>getOpParamValById(2, op_params),
        <number>getOpParamValById(3, op_params),
        warps(input_draft.drawdown),
        wefts(input_draft.drawdown)
    );

    return (size.cols * size.rows <= defaults.max_area);
}

export const aster: Operation = { name, meta, params, inlets, perform, generateName, sizeCheck };
