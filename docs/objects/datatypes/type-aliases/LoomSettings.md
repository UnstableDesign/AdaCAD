[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / LoomSettings

# Type Alias: LoomSettings

> **LoomSettings** = `object`

Defined in: objects/datatypes.ts:215

this keeps any user defined preferences associated with a given loom

## Param

the type of loom to use for computations (currently only supporting jacquard, direct tieup/dobby looms, floor looms with shafts and treadles)

## Param

the ends for unit length to use for calcuations

## Param

the units to use for length, currently supports inches (1 inch), or centimeters (10cm)

## Param

the number of frames the user has specified as the max for their loom

## Param

the number of treadles the user has specified as the max for their loom or -1, if they have no limit

## Properties

### epi

> **epi**: `number`

Defined in: objects/datatypes.ts:217

***

### frames

> **frames**: `number`

Defined in: objects/datatypes.ts:219

***

### treadles

> **treadles**: `number`

Defined in: objects/datatypes.ts:220

***

### type

> **type**: `string`

Defined in: objects/datatypes.ts:216

***

### units

> **units**: `"cm"` \| `"in"`

Defined in: objects/datatypes.ts:218
