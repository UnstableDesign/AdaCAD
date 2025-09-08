[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / OperationInlet

# Type Alias: OperationInlet

> **OperationInlet** = `object`

Defined in: objects/datatypes.ts:372

each operation has 0 or more inlets. These are areas where drafts can be entered as inputs to the operation
this datatype is intended only to support static inlets that are defined in operations.

## Param

the display name to show with this inlet

## Param

the type of parameter that becomes mapped to inputs at this inlet, static means that the user cannot change this value

## Param

the description of this inlet

## Param

this is used to alert the user the inforamation from the input this inlet will use, draft or materials.

## Param

the assigned value of the parameter.

## Param

the total number of drafts accepted into this inlet (or -1 if unlimited)

## Properties

### dx

> **dx**: `string`

Defined in: objects/datatypes.ts:375

***

### name

> **name**: `string`

Defined in: objects/datatypes.ts:373

***

### num\_drafts

> **num\_drafts**: `number`

Defined in: objects/datatypes.ts:378

***

### type

> **type**: `"number"` \| `"notation"` \| `"system"` \| `"color"` \| `"static"` \| `"draft"` \| `"profile"` \| `"null"`

Defined in: objects/datatypes.ts:374

***

### uses

> **uses**: `"draft"` \| `"weft-data"` \| `"warp-data"` \| `"warp-and-weft-data"`

Defined in: objects/datatypes.ts:376

***

### value

> **value**: [`OpInletValType`](OpInletValType.md)

Defined in: objects/datatypes.ts:377
