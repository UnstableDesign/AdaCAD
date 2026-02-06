# Sequence Directory

This directory contains the `Sequence` namespace with classes for manipulating 1D and 2D sequences of interlacement values. Sequences provide a different, and more fluid and sequential way of manipulating patterns used throughout AdaCAD's operations. 

For example, consider the twill operation. if provided with numeric values for the number of warps `raised`, and `lowered`, a boolean for direction called `sz` and a boolean for the side of the twill that is `facing`,  you can create the corresponding twill in the following way: 

```typescript

//initialize a plan 1d sequence object - []
const first_row = new Sequence.OneD();

//push values to that object based on the values of raised and lowered.
first_row.pushMultiple(1, raised).pushMultiple(0, lowered);
//if raised is 3 and lowered is 2, the object now reads [1, 1, 1, 0, 0]

//depending on the face that should be shown, invert the pattern 
if (facing) first_row.invert(); //[0, 0, 0, 1, 1]

//create a 2D object that will hold the sequences as "rows"

const pattern = new Sequence.TwoD();
const shift_dir = (sz) ? -1 : 1;

//loop through the total number of rows in the twill, on each row, shift the sequence by 1 and push the result 
for (let i = 0; i < (raised + lowered); i++) {
  pattern.pushWeftSequence(first_row.shift(shift_dir).val());
}

//would result in
// [1, 1, 1, 0, 0]
// [0, 1, 1, 1, 0]
// [0, 0, 1, 1, 1]
// [1, 0, 0, 1, 1]
// [1, 1, 0, 0, 1]

//call pattern.export to covert this 2D numeric array to a drawdown object. 
const draft = initDraftFromDrawdown(pattern.export())

```




## Directory Structure

### Core Files

#### `sequence.ts`
Contains the `Sequence` namespace with two main classes:

**`Sequence.OneD`**: One-dimensional sequence class for manipulating rows or columns of interlacement values.

**`Sequence.TwoD`**: Two-dimensional sequence class for manipulating full drawdown patterns.

#### `index.ts`
Exports the Sequence namespace.

## Sequence Values

Sequences use numeric values to represent cell states:
- `0`: Heddle down (white cell)
- `1`: Heddle up (black cell)
- `2`: Unset (no weft at this location)

## Sequence.OneD API

### Construction
```typescript
const seq = new Sequence.OneD([0, 1, 0, 1]); // Initialize with array
const empty = new Sequence.OneD(); // Empty sequence
```

### Manipulation Methods
- `push(val: number | boolean)`: Adds value to end
- `unshift(val: number | boolean)`: Adds value to beginning
- `pushMultiple(val: number | boolean, multiple: number)`: Pushes multiple copies
- `unshiftMultiple(val: number | boolean, multiple: number)`: Unshifts multiple copies
- `resize(n: number)`: Resizes sequence to length n (repeats or truncates)
- `padTo(n: number)`: Pads sequence to length n with unset values (2)
- `invert()`: Inverts all values (0↔1, 2 stays 2)
- `slice(start: number, end: number)`: Slices sequence
- `shift(val: number)`: Shifts sequence by val positions
- `repeat(val: number)`: Repeats sequence val times
- `reverse()`: Reverses sequence order
- `deleteAndDrawIn(val: number)`: Deletes value at index and moves to front

### Import/Export
- `import(row: Array<Cell> | Array<number>)`: Imports from cell array or number array
- `pushRow(row: Array<Cell> | Array<number>)`: Pushes row without clearing state

### Query Methods
- `val()`: Returns sequence as number array
- `get(i: number)`: Gets value at index i
- `set(i: number, val: number | boolean)`: Sets value at index i
- `length()`: Returns sequence length

### Advanced Operations
- `matchSize(seq: OneD)`: Matches size with another sequence by padding with unset
- `computeFilter(filter: string, seq: OneD)`: Applies binary filter operation (AND, OR, XOR, etc.)

## Sequence.TwoD API

### Construction
```typescript
const seq2d = new Sequence.TwoD([[0, 1], [1, 0]]); // Initialize with 2D array
const blank = new Sequence.TwoD().setBlank(2).fill(10, 10); // 10x10 blank
```

### Dimension Methods
- `wefts()`: Returns number of wefts (rows)
- `warps()`: Returns number of warps (columns)
- `fill(w: number, h: number)`: Fills rectangle, repeating pattern as needed
- `setBlank(val: number | boolean)`: Sets blank pattern value

### Access Methods
- `get(i: number, j: number)`: Gets value at position (i, j)
- `set(i: number, j: number, val: number, can_overwrite_set: boolean)`: Sets value
- `getWeft(i: number)`: Gets entire weft (row) as array
- `getWarp(j: number)`: Gets entire warp (column) as array

### Row/Column Manipulation
- `deleteWeft(i: number)`: Deletes a weft row
- `deleteWarp(j: number)`: Deletes a warp column
- `pushWeftSequence(seq: Array<number>)`: Adds weft row to end
- `unshiftWeftSequence(seq: Array<number>)`: Adds weft row to beginning
- `pushWarpSequence(seq: Array<number>)`: Adds warp column to end
- `unshiftWarpSequence(seq: Array<number>)`: Adds warp column to beginning
- `shiftRow(i: number, val: number)`: Shifts a row
- `shiftCol(j: number, val: number)`: Shifts a column

### Transformation Methods
- `overlay(seq: TwoD, consider_heddle_down_as_unset: boolean)`: Overlays another sequence
- `setUnsetOnWeft(i: number, val: number)`: Sets all unset values in a weft
- `setUnsetOnWarp(j: number, val: number)`: Sets all unset values in a warp

### System Mapping Methods
- `mapToSystems(weftsys, warpsys, weft_system_map, warp_system_map, ends, pics)`: Maps sequence to specific warp/weft systems
- `mapToWarpSystems(...)`: Maps to warp systems only
- `mapToWeftSystems(...)`: Maps to weft systems only
- `placeInLayerStack(...)`: Places sequence in layer stack considering previous layers

### Import/Export
- `import(dd: Drawdown)`: Imports from drawdown format
- `export()`: Exports to drawdown format
- `copy()`: Creates a deep copy

## Usage Examples

### Working with 1D Sequences

```typescript
import { Sequence } from './sequence';

// Create and manipulate a pattern
const pattern = new Sequence.OneD([0, 1, 0, 1])
  .repeat(3)           // [0,1,0,1,0,1,0,1,0,1,0,1]
  .invert()           // [1,0,1,0,1,0,1,0,1,0,1,0]
  .shift(2)           // Shift by 2 positions
  .resize(8);         // Resize to 8 elements

const values = pattern.val(); // Get final array
```

### Working with 2D Sequences

```typescript
import { Sequence } from './sequence';

// Create a 2D pattern
const twill = new Sequence.TwoD()
  .setBlank(2)
  .fill(4, 4);

// Set a twill pattern
twill.set(0, 0, 1, true);
twill.set(1, 1, 1, true);
twill.set(2, 2, 1, true);
twill.set(3, 3, 1, true);

// Export to drawdown
const drawdown = twill.export();
```

### System Mapping

```typescript
// Map a pattern to specific systems
const pattern = new Sequence.TwoD([[1, 0], [0, 1]]);
const weftSystems = new Sequence.OneD([0, 1]); // Systems a, b
const warpSystems = new Sequence.OneD([0]);     // System a

pattern.mapToSystems(
  [0],           // Weft systems to map to
  [0],           // Warp systems to map to
  weftSystems,   // Weft system map
  warpSystems,   // Warp system map
  4,             // Output ends
  4              // Output pics
);
```

## How Sequences Are Used

Sequences are primarily used in operations to:

1. **Pattern Manipulation**: Transform patterns before applying to drafts
2. **System Mapping**: Apply patterns to specific warp/weft systems
3. **Layer Management**: Handle multi-layer structures
4. **Pattern Generation**: Build complex patterns from simple sequences

## Extending Sequences

### Adding New 1D Operations

```typescript
// In sequence.ts, add to Sequence.OneD class
mirror(): OneD {
  const reversed = this.state.slice().reverse();
  this.state = this.state.concat(reversed);
  return this;
}

count(val: number): number {
  return this.state.filter(el => el === val).length;
}
```

### Adding New 2D Operations

```typescript
// In sequence.ts, add to Sequence.TwoD class
rotate90(): TwoD {
  const rotated: Array<Array<number>> = [];
  const w = this.warps();
  const h = this.wefts();
  
  for (let j = 0; j < w; j++) {
    rotated.push([]);
    for (let i = h - 1; i >= 0; i--) {
      rotated[j].push(this.get(i, j));
    }
  }
  
  this.state = rotated;
  return this;
}
```

## Best Practices

1. **Method Chaining**: Sequences use fluent API - methods return `this` for chaining
2. **Immutability Consideration**: Most methods mutate internal state. Use `copy()` if you need to preserve original
3. **Bounds Checking**: The classes include bounds checking with error logging
4. **LCM Handling**: When sequences need to be compatible sizes, use LCM (least common multiple) calculations
5. **Unset Values**: Remember that 2 represents unset - handle appropriately in transformations

## Integration

Sequences integrate with:
- **Operations**: Used extensively in operation implementations
- **Drafts**: Can import/export to/from drawdown format
- **Systems**: System mapping is a core feature
- **Utils**: Uses `lcm()` and `computeFilter()` from utils
