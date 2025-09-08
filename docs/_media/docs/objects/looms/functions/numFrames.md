[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/looms](../README.md) / numFrames

# Function: numFrames()

> **numFrames**(`loom`): `number`

Defined in: objects/looms.ts:420

calculates the total number of frames used in this loom
since its called frequently, keep an eye on this to make sure it isn't hanging page loading 
and/or call it once per needed function (instead of multiple times in one function)

## Parameters

### loom

[`Loom`](../../datatypes/type-aliases/Loom.md)

## Returns

`number`

the highest number found in the array
