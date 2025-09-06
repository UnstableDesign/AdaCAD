const countOccurrences = require('../src/utils/utils').countOccurrences;

test('counts occurrences of a value in an array', () => {
  const arr = [1, 2, 3, 1, 4, 1, 5];
  expect(countOccurrences(arr, 1)).toBe(3);
  expect(countOccurrences(arr, 2)).toBe(1);
  expect(countOccurrences(arr, 6)).toBe(0);
});