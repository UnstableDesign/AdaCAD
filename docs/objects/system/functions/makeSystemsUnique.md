[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/system](../README.md) / makeSystemsUnique

# Function: makeSystemsUnique()

> **makeSystemsUnique**(`systems`): `number`[][]

Defined in: objects/system.ts:43

takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing 
drafts that have different system mappings, and making sure they are each unique. 
This function will also return standard sized arrays = to the maximum sized input

## Parameters

### systems

`number`[][]

a 2D array of systems, each row representing a the systems of a different draft.

## Returns

`number`[][]
