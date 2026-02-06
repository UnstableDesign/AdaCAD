# Draft Directory

This directory contains the core data structures and operations for representing and manipulating weaving drafts in AdaCAD. A draft is the fundamental data structure that represents a weaving pattern, including the interlacement pattern (drawdown), material assignments (shuttles), and structural systems.

## Directory Structure

### Core Files

#### `types.ts`
Defines all TypeScript interfaces and types used throughout the draft system:

- **`Draft`**: The main draft interface containing:
  - `id`: Unique numeric identifier
  - `gen_name`: Auto-generated name
  - `ud_name`: User-defined name
  - `drawdown`: 2D array of cells representing the interlacement pattern
  - `rowShuttleMapping`: Array mapping each weft pick to a material/shuttle ID
  - `rowSystemMapping`: Array mapping each weft pick to a system ID
  - `colShuttleMapping`: Array mapping each warp end to a material/shuttle ID
  - `colSystemMapping`: Array mapping each warp end to a system ID
  - `notes`: Optional user notes

- **`Cell`**: Represents a single intersection of warp and weft:
  - `is_set`: Boolean indicating if a weft crosses this location
  - `is_up`: Boolean indicating if the heddle is lifted (true) or lowered (false)
  - Three valid states: `{is_set: true, is_up: true}` (heddle up/black), `{is_set: true, is_up: false}` (heddle down/white), `{is_set: false, is_up: false}` (unset/no weft)

- **`Drawdown`**: Type alias for `Array<Array<Cell>>`, representing a 2D grid of cells

- **`System`**: Represents a structural unit (like a layer):
  - `id`: Numeric identifier
  - `name`: Display name
  - `notes`: User notes
  - `visible`: Visibility flag
  - `in_use`: Whether the system is currently assigned

- **`Interlacement`**: Location within a drawdown:
  - `i`: Row/weft number (0 at top)
  - `j`: Column/warp number (0 at left)

- **`InterlacementVal`**: Location with value:
  - `i`, `j`: Position coordinates
  - `val`: Boolean value (true = heddle up, false = heddle down, null = unset)

- **`InitDraftParams`**: Parameters for initializing drafts with specific settings
- **`InitSystemParams`**: Parameters for initializing systems
- **`CompressedDraft`**: Space-efficient draft format using byte arrays

#### `cell.ts`
Functions for creating and manipulating individual cells:

- `createCell(setting: boolean | null): Cell`
  - Creates a cell from a boolean or null value
  - Handles conversion to proper cell state

- `toggleHeddle(c: Cell): Cell`
  - Toggles the heddle state (up/down)
  - If unset, sets to heddle up

- `createCellFromSequenceVal(val: number): Cell`
  - Creates cell from sequence value (0=down, 1=up, 2=unset)

- `setCellValue(c: Cell, value: boolean | null): Cell`
  - Sets the cell value, handling null for unset

- `getCellValue(c: Cell): boolean | null`
  - Returns the cell value (true/false/null)

- `cellToSequenceVal(c: Cell): number`
  - Converts cell to sequence value (0/1/2)

#### `draft.ts`
Core functions for creating, manipulating, and querying drafts:

**Draft Creation:**
- `initDraft()`: Creates an empty draft with unique ID
- `initDraftWithParams(params: InitDraftParams)`: Creates draft with specific parameters
- `initDraftFromDrawdown(drawdown: Drawdown)`: Creates draft from drawdown only
- `createDraft(...)`: Creates draft with all parameters specified
- `copyDraft(d: Draft)`: Deep copies a draft

**Drawdown Operations:**
- `createBlankDrawdown(wefts: number, warps: number)`: Creates empty drawdown
- `wefts(d: Drawdown)`: Returns number of wefts (rows)
- `warps(d: Drawdown)`: Returns number of warps (columns)
- `hasCell(d: Drawdown, i: number, j: number)`: Checks if cell exists
- `isUp(d: Drawdown, i: number, j: number)`: Checks if heddle is up
- `isSet(d: Drawdown, i: number, j: number)`: Checks if cell is set
- `setHeddle(d: Drawdown, i: number, j: number, bool: boolean)`: Sets heddle state
- `getHeddle(d: Drawdown, i: number, j: number)`: Gets heddle state
- `getCol(d: Drawdown, j: number)`: Gets a column as array

**Drawdown Transformations:**
- `invertDrawdown(drawdown: Drawdown)`: Inverts all cells (up becomes down, etc.)
- `flipDrawdown(drawdown: Drawdown, horiz: boolean)`: Flips horizontally
- `shiftDrawdown(drawdown: Drawdown, up: boolean, inc: number)`: Shifts rows
- `applyMask(mask: Drawdown, pattern: Drawdown)`: Applies mask to pattern
- `pasteIntoDrawdown(...)`: Pastes pattern into drawdown at specified location
- `cropDraft(draft: Draft, top, left, width, height)`: Crops draft to specified region

**Row/Column Manipulation:**
- `insertDrawdownRow(d: Drawdown, i: number, row: Array<Cell>)`: Inserts row
- `deleteDrawdownRow(d: Drawdown, i: number)`: Deletes row
- `insertDrawdownCol(d: Drawdown, j: number, col: Array<Cell>)`: Inserts column
- `deleteDrawdownCol(d: Drawdown, j: number)`: Deletes column
- `insertMappingRow(m: Array<number>, i: number, val: number)`: Inserts into mapping array
- `deleteMappingRow(m: Array<number>, i: number)`: Deletes from mapping array
- `insertMappingCol(m: Array<number>, j: number, val: number)`: Inserts into column mapping
- `deleteMappingCol(m: Array<number>, j: number)`: Deletes from column mapping

**Draft Transformations:**
- `flipDraft(d: Draft, horiz: boolean, vert: boolean)`: Flips draft horizontally/vertically
- `generateMappingFromPattern(drawdown, pattern, type)`: Generates mapping from pattern
- `updateWeftSystemsAndShuttles(to: Draft, from: Draft)`: Updates weft mappings
- `updateWarpSystemsAndShuttles(to: Draft, from: Draft)`: Updates warp mappings

**Compression/Export:**
- `compressDraft(draft: Draft)`: Compresses draft to save space
- `exportDrawdownToArray(drawdown: Drawdown)`: Exports to number array
- `unpackDrawdownFromArray(compressed, warps, wefts)`: Unpacks from array
- `exportDrawdownToBitArray(drawdown: Drawdown)`: Exports to byte array
- `unpackDrawdownFromBitArray(arr, warps, wefts)`: Unpacks from byte array

**Rendering:**
- `getDraftAsImage(draft, pix_per_cell, floats, use_color, mats)`: Generates ImageData for rendering
- `drawDraftViewCell(...)`: Draws a single cell to image data

**Utilities:**
- `getDraftName(draft: Draft)`: Returns display name (user-defined or generated)

#### `system.ts`
Functions for managing systems (structural units):

- `createSystem(systemDict: InitSystemParams)`: Creates a new system
- `setSystemId(sys: System, id: number)`: Sets system ID and generates default name
- `getSystemChar(sys: System)`: Returns character representation (a-z)
- `getSystemCharFromId(id: number)`: Returns character for system ID
- `makeSystemsUnique(systems: Array<Array<number>>)`: Makes system mappings unique across drafts

#### `index.ts`
Exports all public functions and types from the draft directory.

## Usage Examples

### Creating a Draft

```typescript
import { initDraftWithParams, createCell } from './draft';

// Create a 10x10 draft with all cells set to heddle down
const draft = initDraftWithParams({
  wefts: 10,
  warps: 10,
  drawdown: [[createCell(false)]], // Pattern repeats
  ud_name: 'My Draft'
});
```

### Manipulating Cells

```typescript
import { setHeddle, isUp, getCellValue } from './draft';
import { toggleHeddle } from './cell';

// Set a specific cell to heddle up
const newDrawdown = setHeddle(draft.drawdown, 0, 0, true);

// Check cell state
const isHeddleUp = isUp(draft.drawdown, 0, 0);

// Toggle a cell
const cell = draft.drawdown[0][0];
const toggled = toggleHeddle(cell);
```

### Working with Systems

```typescript
import { createSystem, getSystemChar } from './system';

const system = createSystem({
  id: 0,
  name: 'Layer 1',
  visible: true
});

const char = getSystemChar(system); // Returns 'a'
```

## How to Extend the Draft System

### Adding New Cell Operations

Add functions to `cell.ts`:

```typescript
/**
 * Checks if a cell represents a float (heddle up)
 */
export const isFloat = (c: Cell): boolean => {
  return c.is_set && c.is_up;
};

/**
 * Checks if a cell represents a binding (heddle down)
 */
export const isBinding = (c: Cell): boolean => {
  return c.is_set && !c.is_up;
};
```

### Adding New Drawdown Operations

Add functions to `draft.ts`:

```typescript
/**
 * Rotates a drawdown 90 degrees clockwise
 */
export const rotateDrawdown = (drawdown: Drawdown): Drawdown => {
  const rotated: Drawdown = [];
  const weftCount = wefts(drawdown);
  const warpCount = warps(drawdown);
  
  for (let j = 0; j < warpCount; j++) {
    rotated.push([]);
    for (let i = weftCount - 1; i >= 0; i--) {
      rotated[j].push(drawdown[i][j]);
    }
  }
  
  return rotated;
};
```

### Adding New Draft Queries

```typescript
/**
 * Counts the number of floats in a draft
 */
export const countFloats = (draft: Draft): number => {
  let count = 0;
  draft.drawdown.forEach(row => {
    row.forEach(cell => {
      if (cell.is_set && cell.is_up) count++;
    });
  });
  return count;
};
```

## Best Practices

1. **Immutability**: Most functions return new objects rather than mutating inputs. Follow this pattern when extending.

2. **Bounds Checking**: Always check array bounds before accessing cells:
   ```typescript
   if (i >= 0 && i < wefts(drawdown) && j >= 0 && j < warps(drawdown)) {
     // Safe to access
   }
   ```

3. **Cell State Handling**: Remember the three valid cell states and handle null/unset appropriately.

4. **Size Limits**: Check `defaults.max_area` before creating large drafts to prevent rendering issues.

5. **Mapping Arrays**: When manipulating drafts, remember to update corresponding mapping arrays (rowShuttleMapping, etc.) to maintain consistency.

## Integration with Other Systems

- **Loom**: Drafts can be converted to/from loom configurations (threading, tieup, treadling)
- **Materials**: Drafts reference materials through shuttle mappings
- **Operations**: Drafts are the primary input/output for all operations
- **Simulation**: Drafts are used to generate 3D simulations of woven cloth
