[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / Interlacement

# Interface: Interlacement

Defined in: objects/datatypes.ts:150

represents a location within a draft.

## Param

is the row/weft number (0 being at the top of the drawdown)

## Param

is the column/warp number (0 being at the far left of the drawdown)

## Param

is the location of this cell within the current view (where the view may be hiding some rows)
       this value can be de-indexed to absolute position in the rows using draft.visibleRows array

## Example

```ts
const i: number = draft.visibleRows[si];
```

## Properties

### i

> **i**: `number`

Defined in: objects/datatypes.ts:151

***

### j

> **j**: `number`

Defined in: objects/datatypes.ts:152

***

### si

> **si**: `number`

Defined in: objects/datatypes.ts:153
