const exportDrawdownToBitArray = require('../../src/draft/draft.ts').exportDrawdownToBitArray;
const unpackDrawdownFromBitArray = require('../../src/draft/draft.ts').unpackDrawdownFromBitArray;
const initDraftWithParams = require('../../src/draft/draft.ts').initDraftWithParams;
const getCellValue = require('../../src/draft/cell.ts').getCellValue;

test('drawdown bitarray pack and unpack', () => {

    const draft = initDraftWithParams({ wefts: 2, warps: 2, pattern: [[true]] });
    const arr = exportDrawdownToBitArray(draft.drawdown);
    expect(arr.length).toBe(1);

    const draft_offsize = initDraftWithParams({ wefts: 3, warps: 2, pattern: [[true, false]] });
    const arr_offsize = exportDrawdownToBitArray(draft_offsize.drawdown);
    expect(arr_offsize.length).toBe(2);
    expect(arr_offsize[0]).toBe(238); //x11-10-11-10 // 3 - 2 - 3 - 2 //true, false, true, false
    expect(arr_offsize[1]).toBe(224); //x11-10----// 3 - 2 - 0 - 0 //true, false, and 0 to express end of data



    const draft_unpacked = unpackDrawdownFromBitArray(arr_offsize, 2, 3);
    expect(getCellValue(draft_unpacked[0][0])).toBe(true);
    expect(getCellValue(draft_unpacked[0][1])).toBe(false);
    expect(getCellValue(draft_unpacked[1][0])).toBe(true);
    expect(getCellValue(draft_unpacked[1][1])).toBe(false);
    expect(getCellValue(draft_unpacked[2][0])).toBe(true);
    expect(getCellValue(draft_unpacked[2][1])).toBe(false);
});
