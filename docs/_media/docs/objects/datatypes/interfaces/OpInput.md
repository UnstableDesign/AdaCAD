[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / OpInput

# Interface: OpInput

Defined in: objects/datatypes.ts:492

this is a type that contains and contextualizes a series of inputs to an operation, each inlet on an operation corresponds to one op input

## Param

the drafts (from zero to multiple) associated with this input

## Param

the parameters associated with this input

## Param

the index of the inlet for which the draft is entering upon

## Properties

### drafts

> **drafts**: [`Draft`](Draft.md)[]

Defined in: objects/datatypes.ts:493

***

### inlet\_id

> **inlet\_id**: `number`

Defined in: objects/datatypes.ts:495

***

### inlet\_params

> **inlet\_params**: [`OpInletValType`](../type-aliases/OpInletValType.md)[]

Defined in: objects/datatypes.ts:494
