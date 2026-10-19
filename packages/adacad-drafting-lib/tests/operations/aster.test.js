const { warps, wefts } = require('../../src/draft/index.ts');
const { aster } = require('../../src/operations/aster/aster.ts');
const { createDraftFromString, printDrawdownAsString } = require('../../src/utils/utils.ts');

const call = require('../../src/operations/operations.ts').call;

// Expected drafts for a set of param cases: '|' raised, '-' lowered, ' ' unset
const cases = require('./aster.expected.json');

const RECTANGLE = 0, DIAMOND = 1;

const inputFor = (draft) => [{ drafts: [draft], inlet_params: [false], inlet_id: 0 }];

describe('aster matches the expected drafts', () => {
    test.each(cases.map(c => [c.name, c]))('%s', async (_name, c) => {
        const structure = createDraftFromString(c.structure);
        const res = await call(aster, c.params, inputFor(structure));

        expect(res.length).toBe(1);
        expect(printDrawdownAsString(res[0].draft.drawdown)).toBe(c.expected.join('\n'));
    });
});

// Flood the unset cells from the border (4-neighbors); any unset cell not reached is a hole
const enclosedUnsetCells = (drawdown) => {
    const rows = drawdown.length, cols = drawdown[0].length;
    const seen = drawdown.map(row => row.map(() => false));
    const stack = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const onBorder = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
        if (onBorder && !drawdown[r][c].is_set) { seen[r][c] = true; stack.push([r, c]); }
    }
    while (stack.length > 0) {
        const [r, c] = stack.pop();
        for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
            if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
            if (seen[nr][nc] || drawdown[nr][nc].is_set) continue;
            seen[nr][nc] = true;
            stack.push([nr, nc]);
        }
    }
    let holes = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (!drawdown[r][c].is_set && !seen[r][c]) holes++;
    }
    return holes;
}

test('aster never leaves unset cells inside the flower', async () => {
    const structures = ['|--\n-|-\n--|', '|---\n-||-'].map(s => createDraftFromString(s));
    const failures = [];
    for (const structure of structures) {
        for (const corner of [0, 1]) {
            for (let w = 1; w <= 6; w++) {
                for (let L = 1; L <= 5; L++) {
                    const heights = [1, 2, 3, 4];
                    for (const type of [RECTANGLE, DIAMOND]) {
                        for (const h of (type === RECTANGLE ? heights : [1])) {
                            const res = await call(aster, [type, w, h, L, corner], inputFor(structure));
                            const holes = enclosedUnsetCells(res[0].draft.drawdown);
                            if (holes > 0) failures.push(`type ${type} w ${w} h ${h} petal ${L} corner ${corner}: ${holes}`);
                        }
                    }
                }
            }
        }
    }
    expect(failures).toEqual([]);
});

test('aster returns nothing without a structure', async () => {
    const res = await call(aster, [RECTANGLE, 2, 2, 2, 0], []);
    expect(res).toEqual([]);
});

test('aster output size follows the section counts', async () => {
    // 4 ends x 2 picks structure
    const structure = createDraftFromString('|---\n-||-');

    const rect = await call(aster, [RECTANGLE, 3, 1, 2, 0], inputFor(structure));
    expect(warps(rect[0].draft.drawdown)).toBe((3 + 4) * 4);
    expect(wefts(rect[0].draft.drawdown)).toBe((1 + 4) * 2);

    // diamond ignores center height
    const dia = await call(aster, [DIAMOND, 3, 9, 1, 0], inputFor(structure));
    expect(warps(dia[0].draft.drawdown)).toBe(5 * 4);
    expect(wefts(dia[0].draft.drawdown)).toBe(5 * 2);
});

test('aster repeats the structure systems and materials across the output', async () => {
    const structure = createDraftFromString('|---\n-||-');
    structure.rowSystemMapping = [0, 1];
    structure.rowShuttleMapping = [2, 3];
    structure.colSystemMapping = [0, 1, 2, 3];
    structure.colShuttleMapping = [4, 5, 6, 7];

    const res = await call(aster, [RECTANGLE, 2, 3, 2, 1], inputFor(structure));
    const d = res[0].draft;

    d.rowSystemMapping.forEach((v, i) => expect(v).toBe(structure.rowSystemMapping[i % 2]));
    d.rowShuttleMapping.forEach((v, i) => expect(v).toBe(structure.rowShuttleMapping[i % 2]));
    d.colSystemMapping.forEach((v, j) => expect(v).toBe(structure.colSystemMapping[j % 4]));
    d.colShuttleMapping.forEach((v, j) => expect(v).toBe(structure.colShuttleMapping[j % 4]));
});

test('aster leaves the input structure unchanged', async () => {
    const structure = createDraftFromString('|--\n-|-\n--|');
    const before = printDrawdownAsString(structure.drawdown);
    await call(aster, [DIAMOND, 3, 3, 2, 1], inputFor(structure));
    expect(printDrawdownAsString(structure.drawdown)).toBe(before);
});

test('aster sizeCheck rejects outputs over the area limit', () => {
    const structure = createDraftFromString('|--\n-|-\n--|');
    const p = (vals) => aster.params.map((param, i) => ({ param, val: vals[i] }));
    expect(aster.sizeCheck(p([RECTANGLE, 3, 3, 3, 0]), inputFor(structure))).toBe(true);
    expect(aster.sizeCheck(p([RECTANGLE, 100, 100, 100, 0]), inputFor(structure))).toBe(true);
    const big = createDraftFromString(Array(200).fill('|-'.repeat(100)).join('\n'));
    expect(aster.sizeCheck(p([RECTANGLE, 100, 100, 100, 0]), inputFor(big))).toBe(false);
});
