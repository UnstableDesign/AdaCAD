# Loom Directory

This directory contains the core loom representation and computation logic for AdaCAD. It provides a flexible system for representing different types of looms (jacquard, frame/shaft-treadle, and direct-tie/dobby) and converting between loom configurations and drawdowns.

## Directory Structure

### Core Files

#### `types.ts`
Defines the core TypeScript types used throughout the loom system:

- **`Loom`**: The fundamental loom data structure containing:
  - `threading`: Array of numbers representing which frame/shaft each warp thread is assigned to
  - `tieup`: 2D array of booleans representing connections between frames and treadles
  - `treadling`: 2D array of numbers representing which treadles are pressed for each pick

- **`LoomSettings`**: User-defined preferences and constraints:
  - `type`: The loom type identifier ('jacquard', 'frame', or 'direct')
  - `epi`: Ends per unit length (warp density)
  - `ppi`: Picks per unit length (weft density)
  - `units`: Measurement units ('cm' - per 10cm or 'in' - per inch)
  - `frames`: Maximum number of frames/shafts available
  - `treadles`: Maximum number of treadles available (-1 for unlimited)

- **`LoomUtil`**: Interface defining the operations a loom type must support. Each loom type implements this interface to provide type-specific behavior.

#### `loom.ts`
Contains generic/shared functions used across all loom types:

**Loom Creation & Manipulation:**
- `initLoom()`: Creates an empty loom structure
- `copyLoom()`: Deep copies a loom object
- `copyLoomSettings()`: Copies loom settings with defaults

**Conversion Functions:**
- `convertLoom()`: Converts a loom from one type to another
- `convertTieupToLiftPlan()`: Converts frame/treadle loom to direct-tie format
- `convertLiftPlanToTieup()`: Converts direct-tie loom to frame/treadle format
- `computeDrawdown()`: Generates a drawdown from a loom configuration
- `generateThreading()`: Generates threading pattern from a drawdown
- `generateTreadlingforFrameLoom()`: Generates treadling pattern from a drawdown

**Utility Functions:**
- `getLoomUtilByType()`: Returns the appropriate LoomUtil implementation for a loom type
- `numFrames()`: Calculates the number of frames used in a loom
- `numTreadles()`: Calculates the number of treadles used in a loom
- `calcWidth()` / `calcLength()`: Calculate physical dimensions from drawdown and settings
- `convertEPItoMM()`: Converts ends per inch/cm to millimeters
- Range checking functions: `isInThreadingRange()`, `isInTreadlingRange()`, `isInTieupRange()`, etc.
- Flipping functions: `flipLoom()`, `flipThreading()`, `flipTreadling()`, `flipTieUp()`

### Loom Type Implementations

#### `jacquard.ts`
Implements the jacquard loom type (`jacquard_utils`):

- **Type**: `'jacquard'`
- **Display Name**: "jacquard loom"
- **Description**: Drafts exclusively from drawdown, disregarding frame and treadle information
- **Key Features**:
  - Minimal implementation - jacquard looms don't use threading/tieup/treadling
  - Only implements `getDressingInfo()` to display loom information
  - Used when working directly with drawdowns without loom constraints

#### `dobby.ts`
Implements the direct-tie/dobby loom type (`direct_utils`):

- **Type**: `'direct'`
- **Display Name**: "direct-tie or dobby loom"
- **Description**: Uses a direct tieup where each frame connects directly to a corresponding treadle, with support for multiple treadle assignments per pick
- **Key Functions**:
  - `computeLoomFromDrawdown()`: Generates threading and treadling from drawdown, creates direct tieup
  - `computeDrawdownFromLoom()`: Computes drawdown from loom configuration
  - `recomputeLoomFromThreadingAndDrawdown()`: Updates treadling and tieup based on threading and drawdown
  - `updateThreading()` / `updateTreadling()` / `updateTieup()`: Handle individual cell edits
  - `pasteThreading()` / `pasteTreadling()`: Handle pasting patterns into threading/treadling
  - `getDressingInfo()`: Provides detailed loom statistics

#### `shafttreadle.ts`
Implements the frame/shaft-treadle loom type (`frame_utils`):

- **Type**: `'frame'`
- **Display Name**: "shaft/treadle loom"
- **Description**: Uses a tieup matrix to connect frames to treadles, with one treadle per pick
- **Key Functions**:
  - `computeLoomFromDrawdown()`: Generates threading, treadling, and tieup from drawdown
  - `computeDrawdownFromLoom()`: Computes drawdown from loom configuration
  - `recomputeLoomFromThreadingAndDrawdown()`: Updates tieup and treadling based on threading and drawdown
  - `updateThreading()` / `updateTreadling()` / `updateTieup()`: Handle individual cell edits with tieup expansion
  - `pasteThreading()` / `pasteTreadling()` / `pasteTieup()`: Handle pasting patterns
  - `getDressingInfo()`: Provides detailed loom statistics including tieup information

#### `index.ts`
Exports all public functions and types from the loom directory for use throughout the codebase.

## How to Add Your Own Loom Type

To add a new loom type to AdaCAD, follow these steps:

### Step 1: Create a New Loom Implementation File

Create a new TypeScript file (e.g., `mycustomloom.ts`) in the `loom` directory. Import the necessary types and functions:

```typescript
import { Drawdown, InterlacementVal, warps, wefts, getCellValue } from "../draft";
import { LoomUtil, LoomSettings, Loom } from "./types";
import { 
  generateThreading, 
  computeDrawdown, 
  calcWidth,
  // ... other shared functions you need
} from "./loom";
```

### Step 2: Implement the LoomUtil Interface

Create a `LoomUtil` object that implements all required and optional methods:

```typescript
export const mycustom_utils: LoomUtil = {
  type: 'mycustom',  // Your unique type identifier
  displayname: 'My Custom Loom',  // Display name shown in UI
  dx: "Description of how this loom type works",
  
  // Required: Provide dressing information
  getDressingInfo: (dd: Drawdown, loom: Loom, ls: LoomSettings) => {
    return [
      { label: 'loom type', value: 'My Custom Loom' },
      // ... add more info as needed
    ];
  },
  
  // Optional: Compute loom from drawdown
  computeLoomFromDrawdown: async (d: Drawdown, loom_settings: LoomSettings): Promise<Loom> => {
    // Your implementation here
    // Generate threading, tieup, and treadling from the drawdown
  },
  
  // Optional: Compute drawdown from loom
  computeDrawdownFromLoom: async (l: Loom): Promise<Drawdown> => {
    // Your implementation here
    // Use computeDrawdown() or implement custom logic
  },
  
  // Optional: Recompute loom when threading changes
  recomputeLoomFromThreadingAndDrawdown: async (
    l: Loom, 
    loom_settings: LoomSettings, 
    d: Drawdown
  ): Promise<Loom> => {
    // Your implementation here
  },
  
  // Optional: Handle individual cell updates
  updateThreading: (loom: Loom, ndx: InterlacementVal): Loom => {
    // Update threading when user edits a cell
    return loom;
  },
  
  updateTreadling: (loom: Loom, ndx: InterlacementVal): Loom => {
    // Update treadling when user edits a cell
    return loom;
  },
  
  updateTieup: (loom: Loom, ndx: InterlacementVal): Loom => {
    // Update tieup when user edits a cell
    return loom;
  },
  
  // Optional: Handle insertions
  insertIntoThreading: (loom: Loom, j: number, val: number): Loom => {
    // Insert a value into threading at position j
    return loom;
  },
  
  insertIntoTreadling: (loom: Loom, i: number, val: Array<number>): Loom => {
    // Insert a value into treadling at position i
    return loom;
  },
  
  // Optional: Handle deletions
  deleteFromThreading: (loom: Loom, j: number): Loom => {
    // Delete from threading at position j
    return loom;
  },
  
  deleteFromTreadling: (loom: Loom, i: number): Loom => {
    // Delete from treadling at position i
    return loom;
  },
  
  // Optional: Handle pasting operations
  pasteThreading: (
    loom: Loom, 
    drawdown: Drawdown, 
    ndx: InterlacementVal, 
    width: number, 
    height: number
  ): Loom => {
    // Paste drawdown pattern into threading
    return loom;
  },
  
  pasteTreadling: (
    loom: Loom, 
    drawdown: Drawdown, 
    ndx: InterlacementVal, 
    width: number, 
    height: number
  ): Loom => {
    // Paste drawdown pattern into treadling
    return loom;
  },
  
  pasteTieup: (
    loom: Loom, 
    drawdown: Drawdown, 
    ndx: InterlacementVal, 
    width: number, 
    height: number
  ): Loom => {
    // Paste drawdown pattern into tieup
    return loom;
  },
};
```

### Step 3: Register Your Loom Type

Add your loom type to the `getLoomUtilByType()` function in `loom.ts`:

```typescript
export const getLoomUtilByType = (type: 'frame' | 'direct' | 'jacquard' | 'mycustom' | string): LoomUtil => {
  switch (type) {
    case 'frame': return frame_utils;
    case 'direct': return direct_utils;
    case 'jacquard': return jacquard_utils;
    case 'mycustom': return mycustom_utils;  // Add your type here
    default: return jacquard_utils;
  }
}
```

### Step 4: Update Type Definitions

Update the `LoomUtil` type in `types.ts` to include your new type:

```typescript
export type LoomUtil = {
  type: 'jacquard' | 'frame' | 'direct' | 'mycustom',  // Add your type
  // ... rest of the interface
}
```

### Step 5: Export Your Implementation

Add your export to `index.ts`:

```typescript
export * from './mycustomloom';
```

### Step 6: Add Conversion Logic (Optional)

If your loom type needs to convert to/from other loom types, add conversion logic to the `convertLoom()` function in `loom.ts`:

```typescript
export const convertLoom = (drawdown: Drawdown, l: Loom, from_ls: LoomSettings, to_ls: LoomSettings): Promise<Loom | null> => {
  // ... existing conversions ...
  
  // Add your conversion cases
  else if (from_ls.type === 'mycustom' && to_ls.type === 'frame') {
    // Conversion logic here
  }
  
  // ... rest of function
}
```

### Step 7: Update UI (if needed)

If your loom type requires special UI handling, you'll need to update the Angular components in `projects/ui/src/app/editor/loom/` to support your new loom type. This may include:
- Adding the type to loom type selection dropdowns
- Implementing custom rendering for your loom's specific features
- Adding validation for your loom's constraints

## Implementation Tips

1. **Study Existing Implementations**: Look at `dobby.ts` and `shafttreadle.ts` for examples of how to implement the various functions.

2. **Use Shared Functions**: Many functions in `loom.ts` are designed to be reused. Functions like `generateThreading()`, `computeDrawdown()`, and `pasteDirectAndFrameThreading()` can often be used directly or adapted.

3. **Handle Edge Cases**: Make sure your implementation handles:
   - Empty drawdowns
   - Blank columns/rows
   - Invalid indices
   - User-defined frame/treadle limits

4. **Maintain Immutability**: The codebase prefers immutable data structures. When updating looms, create new objects rather than mutating existing ones where possible.

5. **Async Functions**: Some functions return `Promise<Loom>` or `Promise<Drawdown>`. Use `Promise.resolve()` for synchronous operations or implement actual async logic if needed.

6. **Testing**: Consider adding tests for your loom type in the test suite to ensure it works correctly with various drawdowns and settings.

## Example: Minimal Loom Type

Here's a minimal example of a new loom type that only provides basic information:

```typescript
import { Drawdown } from "../draft";
import { LoomUtil, Loom, LoomSettings } from "./types";

export const minimal_utils: LoomUtil = {
  type: 'minimal',
  displayname: 'Minimal Loom',
  dx: "A minimal loom implementation",
  
  getDressingInfo: (dd: Drawdown, loom: Loom, ls: LoomSettings) => {
    return [
      { label: 'loom type', value: 'Minimal Loom' },
      { label: 'warp ends', value: dd[0]?.length.toString() || '0' },
      { label: 'weft picks', value: dd.length.toString() },
    ];
  },
};
```

This minimal implementation can be extended with additional functions as needed.
