# Utils Directory

This directory contains utility functions, default values, and helper functions used throughout AdaCAD. These utilities provide common operations for draft manipulation, mathematical calculations, comparison functions, and configuration defaults.

## Directory Structure

### Core Files

#### `utils.ts`
Contains general-purpose utility functions:

**Array Operations:**
- `areEquivalent(array1, array2)`: Checks if two arrays contain the same values (order-independent)
- `filterToUniqueValues(arr)`: Returns array with only unique values
- `getArrayMax(arr)`: Returns the maximum value in an array
- `getMostCommon(vals)`: Returns the most frequently occurring value
- `countOccurrences(arr, val)`: Counts occurrences of a value in an array

**Draft Analysis:**
- `hasMatchingRow(i, drawdown)`: Finds first matching row to row i, returns index or -1
- `hasMatchingColumn(j, drawdown)`: Finds first matching column to column j, returns index or -1
- `rowIsBlank(i, drawdown)`: Checks if a row has no heddle-up values
- `colIsBlank(j, drawdown)`: Checks if a column has no heddle-up values
- `hasOnlyUnsetOrDown(cells)`: Checks if cells array has no heddle-up values
- `isDraftDirty(draft, loom)`: Checks if draft has any non-default values
- `getMaxWefts(inputs)`: Returns maximum weft count from array of drafts
- `getMaxWarps(inputs)`: Returns maximum warp count from array of drafts

**Boolean Operations:**
- `computeFilter(op, a, b)`: Applies binary filter operation (AND, OR, XOR, NEQ, ATOP, etc.) handling null/unset values

**Comparison Functions:**
- `areDraftsTheSame(d1, d2)`: Deep comparison of two drafts (ignores names/IDs)
- `areLoomsTheSame(loom1, loom2)`: Deep comparison of two looms
- `areLoomSettingsTheSame(ls1, ls2)`: Compares loom settings

**Mathematical Functions:**
- `gcd(a, b, timeoutMs?, startTime?)`: Greatest Common Divisor using Euclidean algorithm with timeout support
- `lcm(original, timeoutMs)`: Least Common Multiple of an array, calculated pairwise with timeout support
- `modStrict(n, m)`: Strict modulo operation (always returns positive)
- `interpolate(n, range)`: Interpolates value within min/max range

**Material Operations:**
- `updateMaterialIds(material_mapping, index_map, replacement_ndx)`: Updates material IDs using mapping, replaces unmapped with replacement value

**String Operations:**
- `hexToRgb(hex)`: Converts hex color string to RGB object
- `parseRegex(input, regex)`: Parses string using regex, returns matches
- `parseStringToDrawdown(drawdownString)`: Parses string representation to drawdown
- `printDrawdownAsString(drawdown)`: Converts drawdown to string representation
- `createDraftFromString(drawdownString, gen_name?, ud_name?)`: Creates draft from string

**ID Generation:**
- `generateId(len)`: Generates random numeric ID of specified length

**Debugging:**
- `printDrawdown(d)`: Prints drawdown to console in readable format

**System Operations:**
- `makeValidSystemList(input_systems, original_systems)`: Validates and creates valid system list

**Operation Management:**
- `getInletsToUpdate(newInlets, currentInlets)`: Determines which inlets to add/remove
- `sameOrNewerVersion(a, b)`: Compares version strings

#### `defaults.ts`
Contains default configuration values and constants:

**Default Values Object:**
- `lcm_timeout`: Timeout for LCM calculations (1000ms)
- `max_area`: Maximum draft area in cells (6,250,000)
- `draft_detail_cell_size`: Size for detailed draft rendering (20px)
- `draft_name`: Default draft name ('drafty')
- `row_shuttle`, `col_shuttle`: Default shuttle/material IDs
- `row_system`, `col_system`: Default system IDs
- `weft_system_codes`: Array of system character codes ['a'-'z']
- `warps`, `wefts`: Default draft dimensions (12x12)
- `show_materials`: Whether to show materials by default
- `black_cell_up`: Whether black represents heddle up
- `default_material_diameter`: Default material diameter (1mm)
- `loom_settings`: Default loom configuration
- `largest_lcm_factor`: Maximum LCM factor (500)
- `material_type`: Default material type (0)

**Rendering Colors:**
- `rendering_color_defaults`: Array of `DraftCellColor` objects for:
  - `down`: White (255, 255, 255)
  - `up`: Black (0, 0, 0)
  - `unset`: Transparent (0, 0, 0, 0)
  - `edge`: Gray (150, 150, 150)

**UI Configuration Arrays:**
- `origin_option_list`: Draft origin options (top right, bottom right, etc.)
- `draft_view_modes`: View mode options (Draft, Structure, Visual Pattern)
- `loom_types`: Loom type options (Direct Tieup, Shaft/Treadle, Jacquard)
- `density_units`: Unit options (Ends per Inch, Ends per 10cm)
- `draft_edit_source`: Edit source options (Drawdown, Loom Configuration)
- `draft_pencil`: Pencil tool options (Toggle, Up, Down, Unset, Material)
- `draft_edit_mode`: Edit mode options (Draw, Select)
- `mixer_edit_mode`: Mixer mode options (Pan, Move, Select)
- `paste_options`: Paste operation options with icons and capabilities
- `licenses`: Creative Commons license options

**Configuration Functions:**
- `setLCMTimeout(timeout)`: Sets global LCM timeout
- `setMaxArea(max_area)`: Sets global maximum draft area

#### `index.ts`
Exports all utilities and defaults.

## Usage Examples

### Mathematical Operations

```typescript
import { lcm, gcd, modStrict } from './utils';

// Find LCM of multiple numbers
const patternLength = lcm([4, 6, 8], 1000); // Returns 24

// Find GCD
const commonFactor = gcd(48, 18); // Returns 6

// Strict modulo (always positive)
const wrapped = modStrict(-1, 5); // Returns 4 (not -1)
```

### Draft Analysis

```typescript
import { hasMatchingRow, colIsBlank, isDraftDirty } from './utils';

// Find matching rows
const matchIndex = hasMatchingRow(0, drawdown); // -1 if no match

// Check if column is blank
const isEmpty = colIsBlank(0, drawdown);

// Check if draft has been modified
const modified = isDraftDirty(draft, loom);
```

### Array Operations

```typescript
import { areEquivalent, getMostCommon, filterToUniqueValues } from './utils';

// Check if arrays have same values
const same = areEquivalent([1, 2, 3], [3, 1, 2]); // true

// Find most common value
const mode = getMostCommon([1, 2, 2, 3, 2]); // 2

// Get unique values
const unique = filterToUniqueValues([1, 2, 2, 3]); // [1, 2, 3]
```

### Color Conversion

```typescript
import { hexToRgb } from './utils';

const rgb = hexToRgb('#FF0000'); // { r: 255, g: 0, b: 0 }
```

### String Parsing

```typescript
import { parseStringToDrawdown, createDraftFromString } from './utils';

// Parse drawdown string
const drawdown = parseStringToDrawdown("101\n010\n101");

// Create draft from string
const draft = createDraftFromString("101\n010", "Pattern", "Twill");
```

## Best Practices

1. **Timeout Handling**: When using `lcm()` or `gcd()` with large numbers, always provide a timeout to prevent hanging
2. **Null Handling**: Many functions handle null/unset values specially - check function documentation
3. **Immutability**: Most functions don't mutate inputs - create new arrays/objects when needed
4. **Error Handling**: Functions like `lcm()` return -1 on timeout - always check for this
5. **Default Values**: Use `defaults` object for configuration rather than hardcoding values

## Performance Considerations

- **LCM/GCD**: Can be slow with large numbers or many inputs - use timeouts
- **Deep Comparisons**: `areDraftsTheSame()` and `areLoomsTheSame()` iterate through all cells - can be slow for large drafts
- **String Parsing**: `parseStringToDrawdown()` creates many cell objects - consider for large patterns

## Integration

Utils are used throughout:
- **Operations**: All operations use utils for common tasks
- **Draft Manipulation**: Draft functions rely on utils for analysis
- **UI**: Defaults are used for configuration throughout the UI
- **Loom**: Loom operations use LCM/GCD for pattern calculations
- **Sequences**: Sequence operations use `computeFilter()` and `lcm()`
