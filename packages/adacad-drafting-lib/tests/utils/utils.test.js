import { createCell } from '../../src/draft/cell.ts';
import { initDraftWithParams } from '../../src/draft/draft.ts';
import { initLoom, copyLoom } from '../../src/loom/loom.ts';

/** init sample drawdowns */
const d1 = [];
const d2 = [];
const d3 = [];
const tieup_1 = [];
for (let i = 0; i < 10; i++) {
  d1.push([]);
  d2.push([]);
  d3.push([]);
  tieup_1.push([]);
  for (let j = 0; j < 10; j++) {
    if (j == 0) d1[i].push(createCell(null));
    else d1[i].push(createCell(true));
    d2[i].push(createCell(j % 2 == 0));
    d3[i].push(((j + i) % 3 == 1) ? createCell(false) : createCell(null));
    tieup_1.push(false);
  }
}

const blank_draft = initDraftWithParams({ wefts: 10, warps: 10 })
const non_blank_draft = initDraftWithParams({ wefts: 10, warps: 10, drawdown: d1 })
const blank_draft_with_mats = initDraftWithParams({ wefts: 10, warps: 10, rowShuttleMapping: [0, 1], colShuttleMapping: [0, 1], rowSystemMapping: [0, 1], colSystemMapping: [0, 1] })
const empty_loom = initLoom(10, 10, 8, 12);
const loom_with_values = copyLoom(empty_loom);
loom_with_values.treadling[2] = [2, 3]
const arr1 = [1, 2, 3, 1, 4, 1, 5];
const arr2 = ['a', 'b', 'c', 'a', 'b', 'q'];



const areEquivalent = require('../../src/utils/utils.ts').areEquivalent;
test('are equivalent arrays', () => {

  let a = [1, 2, 3];
  let b = [2, 1]
  let c = [1, 2]
  let d = ['a', 'b', 'c']

  expect(areEquivalent(a, b)).toBe(false);
  expect(areEquivalent(c, b)).toBe(true);
  expect(areEquivalent(a, d)).toBe(false);
  expect(areEquivalent([], b)).toBe(false);

});



const countOccurrences = require('../../src/utils/utils.ts').countOccurrences;

test('counts occurrences of a value in an array', () => {

  expect(countOccurrences(arr1, 1)).toBe(3);
  expect(countOccurrences(arr1, 2)).toBe(1);
  expect(countOccurrences(arr1, 6)).toBe(0);
  expect(countOccurrences(arr2, 'a')).toBe(2);
  expect(countOccurrences(arr2, 'z')).toBe(0);
  expect(countOccurrences(arr2, 4)).toBe(0);
});

const hasMatchingRow = require('../../src/utils/utils.ts').hasMatchingRow;

test('test has matching column', () => {


  expect(hasMatchingRow(4, d1)).toBe(0);
  expect(hasMatchingRow(1, d2)).toBe(0);
  expect(hasMatchingRow(5, d3)).toBe(2);
  expect(hasMatchingRow(2, d3)).toBe(5);

});



const hasMatchingColumn = require('../../src/utils/utils.ts').hasMatchingColumn;

test('test has matching column', () => {

  expect(hasMatchingColumn(0, d1)).toBe(-1);
  expect(hasMatchingColumn(1, d1)).toBe(2);
  expect(hasMatchingColumn(5, d2)).toBe(1);
  expect(hasMatchingColumn(0, d3)).toBe(3);
  expect(hasMatchingColumn(3, d3)).toBe(0);
});


const isDraftDirty = require('../../src/utils/utils.ts').isDraftDirty;
test('testing is blank draft', () => {


  expect(isDraftDirty(blank_draft, empty_loom)).toBe(false);
  expect(isDraftDirty(blank_draft, loom_with_values)).toBe(true);
  expect(isDraftDirty(blank_draft_with_mats, empty_loom)).toBe(true);
  expect(isDraftDirty(blank_draft_with_mats, loom_with_values)).toBe(true);
  expect(isDraftDirty(non_blank_draft, empty_loom)).toBe(true);


});


const rowIsBlank = require('../../src/utils/utils.ts').rowIsBlank;


test('testing row is blank', () => {

  expect(rowIsBlank(0, d1)).toBe(false);
  expect(rowIsBlank(6, d3)).toBe(true);

});


const colIsBlank = require('../../src/utils/utils.ts').colIsBlank;
test('testing col is blank ', () => {

  expect(colIsBlank(0, d1)).toBe(true);
  expect(colIsBlank(1, d1)).toBe(false);
  expect(colIsBlank(6, d3)).toBe(true);


});


const computeFilter = require('../../src/utils/utils.ts').computeFilter;
test('has matching heddle', () => {


  expect(computeFilter('neq', true, false)).toBe(true);
  expect(computeFilter('neq', null, false)).toBe(false);
  expect(computeFilter('neq', null, null)).toBe(null);
  expect(computeFilter('neq', true, true)).toBe(false);

  expect(computeFilter('atop', false, true)).toBe(true);
  expect(computeFilter('atop', true, false)).toBe(false);
  expect(computeFilter('atop', true, null)).toBe(true);

  expect(computeFilter('and', true, false)).toBe(false);
  expect(computeFilter('and', null, false)).toBe(false);
  expect(computeFilter('and', null, null)).toBe(null);
  expect(computeFilter('and', true, true)).toBe(true);

  expect(computeFilter('or', false, false)).toBe(false);
  expect(computeFilter('or', null, false)).toBe(false);
  expect(computeFilter('or', null, null)).toBe(null);
  expect(computeFilter('or', true, true)).toBe(true);
  expect(computeFilter('or', false, true)).toBe(true);

});



const getMaxWefts = require('../../src/utils/utils.ts').getMaxWefts;

test('testing get max wefts', () => {

  const da = initDraftWithParams({ wefts: 10, warps: 10 });
  const db = initDraftWithParams({ wefts: 100, warps: 10 });
  const dc = initDraftWithParams({ wefts: 100, warps: 100 });
  const dd = initDraftWithParams({ wefts: 11, warps: 11 });

  expect(getMaxWefts([da, db, dc, dd])).toBe(100);
  expect(getMaxWefts([da, dd])).toBe(11);
  expect(getMaxWefts([])).toBe(0);

});


const getMaxWarps = require('../../src/utils/utils.ts').getMaxWarps;

test('testing get max warps', () => {

  const da = initDraftWithParams({ wefts: 10, warps: 10 });
  const db = initDraftWithParams({ wefts: 100, warps: 10 });
  const dc = initDraftWithParams({ wefts: 100, warps: 100 });
  const dd = initDraftWithParams({ wefts: 11, warps: 11 });

  expect(getMaxWarps([da, db, dc, dd])).toBe(100);
  expect(getMaxWarps([da, dd])).toBe(11);
  expect(getMaxWarps([])).toBe(0);

});


const getMostCommon = require('../../src/utils/utils.ts').getMostCommon;

test('testing get most common', () => {

  expect(getMostCommon(arr1)).toBe(1);
  expect(getMostCommon(arr2)).toBe('a');

});

const updateMaterialIds = require('../../src/utils/utils.ts').updateMaterialIds;

test('testing update material ids', () => {
  let material_map = [1, 0, 1, 0, 3, 4, 3, 4, 2];
  let index_map_a = [
    { old_id: 0, new_id: 0 },
    { old_id: 1, new_id: 1 },
    { old_id: 2, new_id: 2 },
    { old_id: 4, new_id: 3 },
  ];
  let replacement_id = 2;

  expect(updateMaterialIds(material_map, index_map_a, replacement_id)).toEqual([1, 0, 1, 0, 2, 3, 2, 3, 2])
  expect(updateMaterialIds(material_map, [], replacement_id)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2])

})



const getArrayMax = require('../../src/utils/utils.ts').getArrayMax;

test('testing get array max', () => {

  expect(getArrayMax(arr1)).toBe(5);

});


const areLoomSettingsTheSame = require('../../src/utils/utils.ts').areLoomSettingsTheSame;

test('are loom settings the same', () => {

});

const areLoomsTheSame = require('../../src/utils/utils.ts').areLoomsTheSame;

test('are looms the same', () => {

  expect(areLoomsTheSame(loom_with_values, loom_with_values)).toBe(true);
  expect(areLoomsTheSame(loom_with_values, empty_loom)).toBe(false);
  expect(areLoomsTheSame(empty_loom, empty_loom)).toBe(true);

});


const areDraftsTheSame = require('../../src/utils/utils.ts').areDraftsTheSame;

test('testing are drafts the same', () => {

  expect(areDraftsTheSame(blank_draft_with_mats, blank_draft)).toBe(false);
  expect(areDraftsTheSame(non_blank_draft, non_blank_draft)).toBe(true);

});


const gcd = require('../../src/utils/utils.ts').gcd;

test('testing greatest common denominator', () => {

  expect(gcd(12, 6)).toBe(6);
  expect(gcd(6, 12)).toBe(6);
  expect(gcd(12, 144)).toBe(12);
  expect(gcd(600, 2352)).toBe(24);
  expect(gcd(601, 2352)).toBe(1);

});


const lcm = require('../../src/utils/utils.ts').lcm;

test('testing least common multiple', () => {

  let arr_a = [6, 7, 8];
  let arr_b = [36, 49];
  let arr_c = [12, 12, 12, 12];
  let arr_d = [1531, 1532];
  console.log(lcm(arr_d, 1000));

  expect(lcm(arr_c, 1000)).toBe(12);
  expect(lcm(arr_b, 1000)).toBe(1764);
  expect(lcm(arr_a, 1000)).toBe(168);

});

const filterToUniqueValues = require('../../src/utils/utils.ts').filterToUniqueValues;

test('testing filter to unique values', () => {
  const arr1 = [1, 2, 3, 1, 4, 1, 5];
  const arr2 = ['c', 'a', 'b', 'c', 'a', 'b', 'q'];
  const arr3 = ['a', 'b', 1, 'a', 'b', 2];
  const arr4 = [1, null, 3, 1, 4, 1, 5];
  const arr5 = [0, 'a', 'b', 'c', 'a', 'b', 'c'];

  expect(filterToUniqueValues(arr1)).toEqual([1, 2, 3, 4, 5])
  expect(filterToUniqueValues(arr2)).toEqual(['c', 'a', 'b', 'q'])
  expect(filterToUniqueValues(arr3)).toEqual(['a', 'b', 1, 2])
  expect(filterToUniqueValues(arr4)).toEqual([1, null, 3, 4, 5])
  expect(filterToUniqueValues(arr4)).not.toEqual([1, 3, 4, 5])
  expect(filterToUniqueValues(arr5)).toEqual([0, 'a', 'b', 'c'])
});


const parseRegex = require('../../src/utils/utils.ts').parseRegex;

test('parse regex', () => {
  let a = 'a1b2'
  let b = '12--'
  let c = '\na b'
  let d = 'a1 b \n\tc'
  let letters = /[a-zA-Z]+/g;
  let otherregex = /\S+/g;

  expect(parseRegex(a, letters)).toEqual(["a", "b"])
  expect(parseRegex(b, letters)).toEqual([])
  expect(parseRegex(c, letters)).toEqual(["a", "b"])
  expect(parseRegex(d, letters)).toEqual(["a", "b", "c"])


})

const modStrict = require('../../src/utils/utils.ts').modStrict;

test('testing modStrict', () => {

  expect(modStrict(-1, 20)).toBe(19);
  expect(modStrict(-41, 20)).toBe(19);

});


const generateId = require('../../src/utils/utils.ts').generateId;

test('testing generate id ', () => {

  expect(generateId(8)).toBeGreaterThan(9999999)
  expect(generateId(8)).toBeLessThan(100000000)

});

const { parseStringToDrawdown, createDraftFromString, printDrawdownAsString } = require('../../src/utils/utils.ts');

test('testing parseStringToDrawdown', () => {
  // Test basic parsing
  const drawdownString = '|--|\n-||-';
  const drawdown = parseStringToDrawdown(drawdownString);

  expect(drawdown).toHaveLength(2);
  expect(drawdown[0]).toHaveLength(4); // |--|
  expect(drawdown[1]).toHaveLength(4); // -||-

  // Test cell values for first row: |--|
  expect(drawdown[0][0].is_set).toBe(true);
  expect(drawdown[0][0].is_up).toBe(true);

  expect(drawdown[0][1].is_set).toBe(true);
  expect(drawdown[0][1].is_up).toBe(false);

  expect(drawdown[0][2].is_set).toBe(true);
  expect(drawdown[0][2].is_up).toBe(false);

  expect(drawdown[0][3].is_set).toBe(true);
  expect(drawdown[0][3].is_up).toBe(true);

  // Test cell values for second row: -||-
  expect(drawdown[1][0].is_set).toBe(true);
  expect(drawdown[1][0].is_up).toBe(false);

  expect(drawdown[1][1].is_set).toBe(true);
  expect(drawdown[1][1].is_up).toBe(true);

  expect(drawdown[1][2].is_set).toBe(true);
  expect(drawdown[1][2].is_up).toBe(true);

  expect(drawdown[1][3].is_set).toBe(true);
  expect(drawdown[1][3].is_up).toBe(false);
});

test('testing parseStringToDrawdown with spaces (unset)', () => {
  const drawdownString = '| -\n- |';
  const drawdown = parseStringToDrawdown(drawdownString);

  expect(drawdown).toHaveLength(2);
  expect(drawdown[0]).toHaveLength(3); // |, space, -
  expect(drawdown[1]).toHaveLength(3); // -, space, |

  // Test cell values including spaces as unset
  expect(drawdown[0][0].is_set).toBe(true);  // |
  expect(drawdown[0][0].is_up).toBe(true);
  expect(drawdown[0][1].is_set).toBe(false); // space (unset)
  expect(drawdown[0][1].is_up).toBe(false);
  expect(drawdown[0][2].is_set).toBe(true);  // -
  expect(drawdown[0][2].is_up).toBe(false);

  expect(drawdown[1][0].is_set).toBe(true);  // -
  expect(drawdown[1][0].is_up).toBe(false);
  expect(drawdown[1][1].is_set).toBe(false); // space (unset)
  expect(drawdown[1][1].is_up).toBe(false);
  expect(drawdown[1][2].is_set).toBe(true);  // |
  expect(drawdown[1][2].is_up).toBe(true);
});

test('testing createDraftFromString', () => {
  const drawdownString = '|-\n-|';
  const draft = createDraftFromString(drawdownString, 'Test Draft', 'My Draft');

  expect(draft.gen_name).toBe('Test Draft');
  expect(draft.ud_name).toBe('My Draft');
  expect(draft.drawdown).toHaveLength(2);
  expect(draft.drawdown[0]).toHaveLength(2);
  expect(draft.rowShuttleMapping).toHaveLength(2);
  expect(draft.colShuttleMapping).toHaveLength(2);
  expect(draft.rowSystemMapping).toHaveLength(2);
  expect(draft.colSystemMapping).toHaveLength(2);
});

test('testing createDraftFromString with user example', () => {
  const drawdownString = ' |  - - ';
  const draft = createDraftFromString(drawdownString);

  expect(draft.drawdown).toHaveLength(1);
  expect(draft.drawdown[0]).toHaveLength(8); // space, |, space, space, -, space, -, space

  // Test the specific pattern from user example (spaces as unset)
  expect(draft.drawdown[0][0].is_set).toBe(false); // space (unset)
  expect(draft.drawdown[0][0].is_up).toBe(false);
  expect(draft.drawdown[0][1].is_set).toBe(true);  // |
  expect(draft.drawdown[0][1].is_up).toBe(true);
  expect(draft.drawdown[0][2].is_set).toBe(false); // space (unset)
  expect(draft.drawdown[0][2].is_up).toBe(false);
  expect(draft.drawdown[0][3].is_set).toBe(false); // space (unset)
  expect(draft.drawdown[0][3].is_up).toBe(false);
  expect(draft.drawdown[0][4].is_set).toBe(true);  // -
  expect(draft.drawdown[0][4].is_up).toBe(false);
  expect(draft.drawdown[0][5].is_set).toBe(false); // space (unset)
  expect(draft.drawdown[0][5].is_up).toBe(false);
  expect(draft.drawdown[0][6].is_set).toBe(true);  // -
  expect(draft.drawdown[0][6].is_up).toBe(false);
  expect(draft.drawdown[0][7].is_set).toBe(false); // space (unset)
  expect(draft.drawdown[0][7].is_up).toBe(false);
});

test('testing printDrawdownAsString', () => {
  // Test basic conversion
  const drawdownString = '|--|\n-||-';
  const drawdown = parseStringToDrawdown(drawdownString);
  const resultString = printDrawdownAsString(drawdown);

  expect(resultString).toBe('|--|\n-||-');
});

test('testing printDrawdownAsString with spaces', () => {
  // Test conversion with unset cells (spaces)
  const drawdownString = '| -\n- |';
  const drawdown = parseStringToDrawdown(drawdownString);
  const resultString = printDrawdownAsString(drawdown);

  expect(resultString).toBe('| -\n- |');
});

test('testing printDrawdownAsString with user example', () => {
  // Test the user example string
  const drawdownString = ' |  - - ';
  const drawdown = parseStringToDrawdown(drawdownString);
  const resultString = printDrawdownAsString(drawdown);

  expect(resultString).toBe(' |  - - ');
});

test('testing round-trip conversion (string -> drawdown -> string)', () => {
  // Test that parseStringToDrawdown and printDrawdownAsString are inverse operations
  const originalStrings = [
    '|--|\n-||-',
    '| -\n- |',
    ' |  - - ',
    '||--\n--||\n-||-',
    '   \n|||\n   '
  ];

  for (const originalString of originalStrings) {
    const drawdown = parseStringToDrawdown(originalString);
    const resultString = printDrawdownAsString(drawdown);
    expect(resultString).toBe(originalString);
  }
});

test('testing printDrawdownAsString with empty drawdown', () => {
  // Test with empty drawdown
  const emptyDrawdown = [];
  const resultString = printDrawdownAsString(emptyDrawdown);

  expect(resultString).toBe('');
});

test('testing printDrawdownAsString with single row', () => {
  // Test with single row
  const drawdownString = '|- |';
  const drawdown = parseStringToDrawdown(drawdownString);
  const resultString = printDrawdownAsString(drawdown);

  expect(resultString).toBe('|- |');
});
