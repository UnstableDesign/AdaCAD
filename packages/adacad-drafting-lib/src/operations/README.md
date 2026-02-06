<<<<<<< HEAD
# Create an Operation


1. give your operation a unique name, create a folder within operations of that name. 
2. write code in `[unique_name].ts`
3. write documentation in  `[unique_name].md`
4. ..generate a test ada file for this operation to run in the screen shot generation script. 
5. register your operation on `operation_list.ts`
=======
# Operations Directory

This directory contains all the operations available in AdaCAD. Operations are the building blocks of the dataflow system - they take drafts as inputs, apply transformations or generate new patterns, and output drafts.

## General Structure of an Operation

Every operation follows a consistent structure with the following components:

### 1. **Name**
A unique internal identifier (string). **Important**: Changing operation names will break compatibility with legacy files.

```typescript
const name = "my_operation";
```

### 2. **Metadata (`OpMeta`)**
Information about the operation displayed in the UI:

```typescript
const meta: OpMeta = {
  displayname: 'Display Name',        // Name shown in UI
  desc: 'Description of what this operation does',
  img: 'operation.png',                // Optional: screenshot filename
  categories: [structureOp],           // One or more categories
  advanced: false,                      // Optional: mark as advanced
  deprecated: false,                    // Optional: mark as deprecated
  old_names: ['oldname'],              // Optional: legacy names for compatibility
  authors: ['Author Name'],            // Optional: credit authors
  urls: [{ url: '...', text: '...' }] // Optional: related links
}
```

### 3. **Parameters (`params`)**
Array of parameters that users can configure. Each parameter has:
- `name`: Internal parameter name
- `type`: Parameter type (`'number'`, `'boolean'`, `'select'`, `'string'`, `'file'`, `'draft'`)
- `value`: Default value
- `dx`: Description shown to users

**Parameter Types:**
- **`NumParam`**: Number with min/max bounds
- **`BoolParam`**: Boolean with true/false state descriptions
- **`StringParam`**: String with regex validation
- **`SelectParam`**: Dropdown with select list
- **`FileParam`**: File upload
- **`CodeParam`**: Code block with documentation

```typescript
const width: NumParam = {
  name: 'width',
  type: 'number',
  min: 1,
  max: 1000,
  value: 10,
  dx: 'Width of the pattern'
};

const params = [width];
```

### 4. **Inlets (`inlets`)**
Array of input slots where drafts can be connected. Each inlet has:
- `name`: Display name
- `type`: Inlet type (`'static'`, `'draft'`, `'number'`, `'notation'`, `'system'`, `'color'`, `'profile'`, `'null'`)
- `dx`: Description
- `uses`: What data is used (`'draft'`, `'warp-data'`, `'weft-data'`, `'warp-and-weft-data'`)
- `value`: Default value
- `num_drafts`: Number of drafts accepted (-1 for unlimited)

```typescript
const draft_inlet: OperationInlet = {
  name: 'input draft',
  type: 'draft',
  dx: 'The draft to transform',
  uses: 'draft',
  value: null,
  num_drafts: 1
};

const inlets = [draft_inlet];
```

### 5. **Perform Function**
The core logic that executes when the operation runs. Takes parameters and inputs, returns a Promise of outputs:

```typescript
const perform = (
  op_settings: Array<OpParamVal>, 
  op_inputs: Array<OpInput>
): Promise<Array<OpOutput>> => {
  // Extract parameter values
  const width = <number>getOpParamValById(0, op_settings);
  
  // Get input drafts
  const inputDrafts = getAllDraftsAtInlet(op_inputs, 0);
  
  // Perform operation logic
  const result = initDraftFromDrawdown(/* ... */);
  
  // Return outputs
  return Promise.resolve([{ draft: result }]);
}
```

### 6. **Generate Name Function**
Creates a default name for the output draft based on parameters:

```typescript
const generateName = (
  op_settings: Array<OpParamVal>, 
  op_inputs: Array<OpInput>
): string => {
  const width = <number>getOpParamValById(0, op_settings);
  return `my_operation(${width})`;
}
```

### 7. **Size Check Function**
Validates that the operation won't create drafts that are too large to render:

```typescript
const sizeCheck = (
  op_settings: Array<OpParamVal>, 
  op_inputs: Array<OpInput>
): boolean => {
  // Calculate expected output size
  const expectedSize = /* ... */;
  return expectedSize <= defaults.max_area;
}
```

### 8. **Export**
Export the operation object:

```typescript
export const my_operation: Operation = {
  name,
  meta,
  params,
  inlets,
  perform,
  generateName,
  sizeCheck
};
```

## Regular Operations vs Dynamic Operations

### Regular Operations
Regular operations have a **fixed number of inlets** defined at compile time. All inlets are specified in the `inlets` array.

**Example**: The `twill` operation always has zero inlets - it generates a pattern from parameters only.

```typescript
export const twill: Operation = {
  name: "twill",
  params: [warps_raised, warps_lowered, sz, facing],
  inlets: [],  // Fixed: no inputs
  // ...
};
```

### Dynamic Operations
Dynamic operations have a **variable number of inlets** that are created based on a parameter value. The number and configuration of inlets changes when the user modifies a specific parameter.

**Key Differences:**
- Extends `Operation` with additional properties:
  - `dynamic_param_id`: Index of the parameter that controls inlet creation
  - `dynamic_param_type`: Type of inlets to create (`'profile'`, `'notation'`, `'number'`, etc.)
  - `onParamChange`: Function that generates inlet values when the parameter changes

**Example**: The `warp_profile` operation creates inlets based on letters in a pattern string:

```typescript
const dynamic_param_id = 0;  // Pattern parameter controls inlets
const dynamic_param_type = 'profile';

const onParamChange = (
  param_vals: Array<OpParamVal>,
  static_inlets: Array<OperationInlet>,
  inlet_vals: Array<OpInletValType>,
  changed_param_id: number,
  dynamic_param_val: OpParamValType
): Array<OpInletValType> => {
  // Parse pattern string: "a b c" -> ['a', 'b', 'c']
  const matches = parseRegex(<string>dynamic_param_val, regex);
  const unique = filterToUniqueValues(matches);
  
  // Return array of inlet values (one per unique letter)
  return static_inlet_vals.concat(unique);
};

export const warp_profile: DynamicOperation = {
  name: "warp_profile",
  dynamic_param_id,
  dynamic_param_type,
  onParamChange,
  // ... other Operation properties
};
```

**When to Use Dynamic Operations:**
- When the number of inputs depends on user input (e.g., pattern strings, layer notation)
- When you need to create multiple similar inlets (e.g., one per letter in a pattern)
- When inlet configuration needs to change based on parameters

## How to Create Your Own Operation

### Step 1: Create Operation Directory

Create a new folder in the `operations` directory with your operation name:

```bash
mkdir operations/my_operation
cd operations/my_operation
```

### Step 2: Create Operation File

Create `my_operation.ts` with the operation structure:

```typescript
import { initDraftFromDrawdown } from "../../draft";
import { Sequence } from "../../sequence";
import { getOpParamValById, getAllDraftsAtInlet } from "../operations";
import { NumParam, OperationInlet, OpParamVal, OpInput, Operation, OpMeta } from "../types";
import { structureOp } from "../categories";
import { defaults } from "../../utils";

const name = "my_operation";

const meta: OpMeta = {
  displayname: 'My Operation',
  desc: 'A brief description of what this operation does',
  img: 'my_operation.png',  // Optional: add screenshot later
  categories: [structureOp]
};

// PARAMS
const width: NumParam = {
  name: 'width',
  type: 'number',
  min: 1,
  max: 1000,
  value: 10,
  dx: 'Width of the pattern'
};

const params = [width];

// INLETS
const input: OperationInlet = {
  name: 'input draft',
  type: 'draft',
  dx: 'The draft to transform',
  uses: 'draft',
  value: null,
  num_drafts: 1
};

const inlets = [input];

// PERFORM
const perform = (
  op_settings: Array<OpParamVal>,
  op_inputs: Array<OpInput>
): Promise<Array<OpOutput>> => {
  // Get parameter value
  const width = <number>getOpParamValById(0, op_settings);
  
  // Get input drafts
  const inputDrafts = getAllDraftsAtInlet(op_inputs, 0);
  
  if (inputDrafts.length === 0) {
    return Promise.resolve([]);
  }
  
  const inputDraft = inputDrafts[0];
  
  // Your operation logic here
  const pattern = new Sequence.TwoD()
    .setBlank(2)
    .fill(width, width);
  
  // Example: copy input pattern
  pattern.import(inputDraft.drawdown);
  
  const result = initDraftFromDrawdown(pattern.export());
  return Promise.resolve([{ draft: result }]);
};

// GENERATE NAME
const generateName = (
  op_settings: Array<OpParamVal>,
  op_inputs: Array<OpInput>
): string => {
  const width = <number>getOpParamValById(0, op_settings);
  return `my_operation(${width})`;
};

// SIZE CHECK
const sizeCheck = (
  op_settings: Array<OpParamVal>,
  op_inputs: Array<OpInput>
): boolean => {
  const width = <number>getOpParamValById(0, op_settings);
  const size = width * width;
  return size <= defaults.max_area;
};

export const my_operation: Operation = {
  name,
  meta,
  params,
  inlets,
  perform,
  generateName,
  sizeCheck
};
```

### Step 3: Create Documentation

Create `my_operation.md` with documentation:

```markdown
# My Operation

## Description
Detailed description of what this operation does.

## Parameters
- **width**: Description of the width parameter

## Inputs
- **input draft**: Description of the input draft

## Outputs
- Description of the output draft

## Examples
Examples of how to use this operation.
```

### Step 4: Register Operation

Add your operation to `operation_list.ts`:

```typescript
export * from './my_operation/my_operation';
```

### Step 5: (Optional) Add Screenshot

Add a PNG screenshot named `my_operation.png` in your operation directory. This will be displayed in the UI.

### Step 6: (Optional) Create Test File

Create a test `.ada` file for screenshot generation. Place it in the screenshot generator directory.

## Creating a Dynamic Operation

To create a dynamic operation, follow the same steps but:

1. **Import `DynamicOperation` type**:
```typescript
import { DynamicOperation } from "../types";
```

2. **Define dynamic parameter properties**:
```typescript
const dynamic_param_id = 0;  // Index of parameter controlling inlets
const dynamic_param_type = 'profile';  // Type of dynamic inlets
```

3. **Implement `onParamChange` function**:
```typescript
const onParamChange = (
  param_vals: Array<OpParamVal>,
  static_inlets: Array<OperationInlet>,
  inlet_vals: Array<OpInletValType>,
  changed_param_id: number,
  dynamic_param_val: OpParamValType
): Array<OpInletValType> => {
  // Parse the dynamic parameter value
  // Return array of inlet values (one per dynamic inlet)
  const parsed = parseDynamicValue(dynamic_param_val);
  return static_inlet_vals.concat(parsed);
};
```

4. **Export as `DynamicOperation`**:
```typescript
export const my_dynamic_operation: DynamicOperation = {
  name,
  meta,
  params,
  inlets,  // Static inlets only
  dynamic_param_id,
  dynamic_param_type,
  onParamChange,
  perform,
  generateName,
  sizeCheck
};
```

## Helper Functions

Common functions used in operations:

- `getOpParamValById(id, param_vals)`: Get parameter value by index
- `getAllDraftsAtInlet(op_inputs, inlet_id)`: Get all drafts from an inlet
- `reduceToStaticInputs(inlets, inlet_vals)`: Get values for static inlets only
- `initDraftFromDrawdown(drawdown)`: Create draft from drawdown
- `lcm(numbers, timeout)`: Calculate least common multiple
- `parseRegex(input, regex)`: Parse string with regex

## Best Practices

1. **Error Handling**: Always check for empty inputs and return empty array if invalid
2. **Size Validation**: Always implement `sizeCheck` to prevent oversized drafts
3. **Name Generation**: Make `generateName` descriptive and include key parameters
4. **Documentation**: Write clear descriptions for users
5. **Type Safety**: Use type assertions (`<number>`, `<string>`) when extracting values
6. **Immutability**: Don't mutate input drafts - create new ones
7. **Promise Handling**: Always return `Promise.resolve()` even for synchronous operations
8. **Parameter Validation**: Use appropriate parameter types with validation (min/max, regex)

## Operation Categories

Choose appropriate categories from `categories.ts`:
- `structureOp`: Weave structures (twill, satin, etc.)
- `transformationOp`: Transformations (flip, rotate, etc.)
- `clothOp`: Cloth/pattern arrangements
- `compoundOp`: Compound/multi-layer structures
- `dissectOp`: Splitting operations
- `computeOp`: Computational/mathematical operations
- `helperOp`: Drafting helpers
- `colorEffectsOp`: Material/color operations
- `draftingStylesOp`: Style conversions

## Example: Complete Regular Operation

See `twill/twill.ts` for a complete example of a regular operation.

## Example: Complete Dynamic Operation

See `warp_profile/warp_profile.ts` or `notation/notation.ts` for complete examples of dynamic operations.
>>>>>>> v5.0
