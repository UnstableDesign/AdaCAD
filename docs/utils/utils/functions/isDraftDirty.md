[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [utils/utils](../README.md) / isDraftDirty

# Function: isDraftDirty()

> **isDraftDirty**(`d`, `loom`): `boolean`

Defined in: utils/utils.ts:90

This function looks to see if a draft has any user-supplied information.

## Parameters

### d

[`Draft`](../../../objects/datatypes/interfaces/Draft.md)

the draft in question

### loom

[`Loom`](../../../objects/datatypes/type-aliases/Loom.md)

the loom associated with this draft (or null if there is no loom)

## Returns

`boolean`

true if any part of the draft or loom contains a non-default value
