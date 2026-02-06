# Material Directory

This directory contains the core material representation and management logic for AdaCAD. Materials represent the yarns, threads, or other elements used in weaving, including their visual properties (color, diameter) and physical properties (stretch, thickness) that affect how they are rendered and simulated.

## Directory Structure

### Core Files

#### `types.ts`
Defines the core TypeScript interfaces used throughout the material system:

- **`Material`**: The fundamental material data structure containing:
  - `id`: Unique numeric identifier for the material
  - `name`: Human-readable name for the material
  - `insert`: Boolean indicating insertion direction (true = left, false = right)
  - `visible`: Boolean indicating whether the material should be displayed
  - `stretch`: Number between 0-1 representing material stretch/elasticity
  - `color`: Hex color string (e.g., "#FF0000") for visual representation
  - `thickness`: Percentage of base dimensions (typically 100)
  - `type`: Numeric type identifier (defaults to 0)
  - `diameter`: Material diameter in millimeters (used for simulation)
  - `startLabel`: **deprecated** Optional label for the start of the material sequence
  - `endLabel`:  **deprecated** Optional label for the end of the material sequence
  - `notes`: String for additional notes about the material
  - `rgb`: RGB color object with `{ r, g, b }` values (0-255)

- **`MaterialImport`**: Partial interface for importing materials with optional fields. Used when creating materials from external data where not all fields may be present.

- **`MaterialsList`**: Type alias for `Array<Material>`, representing a collection of materials.

- **`MaterialMap`**: Interface for mapping old material IDs to new material IDs, used during material merging or transformation operations:
  - `old_id`: The original material ID
  - `new_id`: The new material ID after mapping

#### `material.ts`
Contains functions for creating, manipulating, and querying materials:

**Material Creation:**
- `createMaterial(matDict: MaterialImport): Material`
  - Creates a new material object with sensible defaults
  - Accepts a partial `MaterialImport` object and fills in missing values
  - Defaults include: gray color (#666666), 100% thickness, 1mm diameter, visible and insert from left (true)
  - Automatically converts hex color to RGB values

**Material Manipulation:**
- `setMaterialID(m: Material, id: number): Material`
  - Sets the material ID and generates a default name if none exists
  - Default name format: "Material {id + 1}"

- `setMaterialStretch(m: Material, stretch: number): Material`
  - Sets the material stretch value (0-1)
  - Clamps values outside the valid range with error logging
  - Returns the modified material

- `getMaterialStretch(m: Material): number`
  - Returns the stretch value for a material

**Material Queries:**
- `getDiameter(id: number, ms: MaterialsList): number`
  - Finds a material by ID in a materials list and returns its diameter
  - Returns 0 if material is not found

- `getColorForSim(id: number, ms: MaterialsList): string`
  - Finds a material by ID and converts its hex color to a format suitable for simulation
  - Returns color as a hex number string (e.g., "0x000000")
  - Returns "0x000000" (black) if material is not found

**Material List Utilities:**
- `standardizeMaterialLists(shuttles: Array<Array<number>>): Array<Array<number>>`
  - Standardizes multiple material mapping arrays to the same length
  - Finds the maximum length across all arrays
  - Pads shorter arrays by repeating their first element
  - Used to ensure consistent material sequences across different systems (warp/weft)

#### `index.ts`
Exports all public functions and types from the material directory for use throughout the codebase.

## Material Usage in AdaCAD

Materials are used throughout AdaCAD to:

1. **Visual Representation**: Materials are assigned colors that appear in the draft editor, allowing users to visualize different yarns/threads
2. **Simulation**: Material properties (diameter, stretch) are used in the simulation engine to predict how the woven cloth will look and behave
3. **System Assignment**: Materials are associated with warp and weft systems to define which material is used in each thread/pick
4. **Operations**: Various operations (like `apply_materials`, `apply_warp_materials`, `apply_weft_materials`) use materials to modify drafts

## How to Add Your Own Material Functions

The material system is designed to be extensible. Here's how to add new functionality:

### Step 1: Add New Functions to `material.ts`

Create new functions following the existing patterns:

```typescript
import { Material, MaterialsList } from "./types";

/**
 * Example: Get material by name
 * @param name The name to search for
 * @param ms The materials list to search
 * @returns The material if found, undefined otherwise
 */
export const getMaterialByName = (name: string, ms: MaterialsList): Material | undefined => {
  return ms.find(m => m.name === name);
};

/**
 * Example: Filter materials by visibility
 * @param ms The materials list to filter
 * @returns Array of visible materials
 */
export const getVisibleMaterials = (ms: MaterialsList): MaterialsList => {
  return ms.filter(m => m.visible);
};

/**
 * Example: Calculate total material diameter
 * @param ids Array of material IDs
 * @param ms The materials list
 * @returns Sum of diameters
 */
export const getTotalDiameter = (ids: Array<number>, ms: MaterialsList): number => {
  return ids.reduce((sum, id) => {
    return sum + getDiameter(id, ms);
  }, 0);
};
```

### Step 2: Export New Functions

Add your new functions to `index.ts`:

```typescript
export * from './material';
export * from './types';
// Your new exports will be included automatically if they're in material.ts
```

### Step 3: Extend Types (if needed)

If you need new properties on materials, extend the `Material` interface in `types.ts`:

```typescript
export interface Material {
  // ... existing properties ...
  
  // New property
  customProperty?: string;
}
```

Also update `MaterialImport` if you want the property to be importable:

```typescript
export interface MaterialImport {
  // ... existing properties ...
  
  customProperty?: string;
}
```

And update `createMaterial()` to handle the new property:

```typescript
export const createMaterial = (matDict: MaterialImport): Material => {
  const m: Material = {
    // ... existing defaults ...
    customProperty: matDict.customProperty ?? 'default value',
  };
  
  // ... rest of function ...
};
```

## Common Patterns and Best Practices

### 1. Material Lookup Pattern

When looking up materials by ID, always handle the case where the material might not exist:

```typescript
export const getMaterialProperty = (id: number, ms: MaterialsList, defaultValue: any): any => {
  const material = ms.find(m => m.id === id);
  if (material === undefined) return defaultValue;
  return material.someProperty;
};
```

### 2. Material Validation

When setting material properties, validate inputs:

```typescript
export const setMaterialDiameter = (m: Material, diameter: number): Material => {
  if (diameter < 0) {
    console.error("Diameter cannot be negative");
    diameter = 0;
  }
  m.diameter = diameter;
  return m;
};
```

### 3. Material List Operations

When working with material lists, consider using functional programming patterns:

```typescript
// Map materials to their colors
export const getMaterialColors = (ms: MaterialsList): Array<string> => {
  return ms.map(m => m.color);
};

// Find materials matching a condition
export const findMaterialsByType = (ms: MaterialsList, type: number): MaterialsList => {
  return ms.filter(m => m.type === type);
};
```

### 4. Material ID Management

Material IDs should be unique within a materials list. When creating new materials:

```typescript
export const getNextMaterialID = (ms: MaterialsList): number => {
  if (ms.length === 0) return 0;
  const maxID = Math.max(...ms.map(m => m.id));
  return maxID + 1;
};

export const createMaterialWithAutoID = (matDict: MaterialImport, ms: MaterialsList): Material => {
  const material = createMaterial(matDict);
  return setMaterialID(material, getNextMaterialID(ms));
};
```

## Integration with Other Systems

### Drafts

Materials are associated with drafts through warp and weft systems. Each cell in a draft can reference a material ID through its system assignments.

### Simulation

The simulation system uses material properties:
- `diameter`: Affects how threads appear in 3D simulation
- `stretch`: Affects how threads curve and bend
- `color`/`rgb`: Determines visual appearance

### Operations

Several operations work with materials:
- `apply_materials`: Applies material sequences to drafts
- `apply_warp_materials`: Applies materials to warp systems
- `apply_weft_materials`: Applies materials to weft systems
- `material_sequence`: Generates material sequences

