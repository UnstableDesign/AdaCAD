[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / Draft

# Interface: Draft

Defined in: objects/datatypes.ts:28

stores a drawdown along with broader information a draft such

## Param

a unique id to refer to this draft, used for linking the draft to screen components

## Param

a automatically generated name for this draft (from parent operation)

## Param

a user defined name for this draft, which, if it exists, will be used instead of the generated name

## Param

the drawdown/interlacement pattern used in this draft

## Param

the repeating pattern to use to assign draft rows to shuttles (materials)

## Param

the repeating pattern to use to assign draft rows to systems (structual units like layers for instance)

## Param

the repeating pattern to use to assign draft columns to shuttles (materials)

## Param

the repeating pattern to use to assign draft columns to systems (structual units like layers for instance)

## Properties

### colShuttleMapping

> **colShuttleMapping**: `number`[]

Defined in: objects/datatypes.ts:35

***

### colSystemMapping

> **colSystemMapping**: `number`[]

Defined in: objects/datatypes.ts:36

***

### drawdown

> **drawdown**: [`Drawdown`](../type-aliases/Drawdown.md)

Defined in: objects/datatypes.ts:32

***

### gen\_name

> **gen\_name**: `string`

Defined in: objects/datatypes.ts:30

***

### id

> **id**: `number`

Defined in: objects/datatypes.ts:29

***

### rowShuttleMapping

> **rowShuttleMapping**: `number`[]

Defined in: objects/datatypes.ts:33

***

### rowSystemMapping

> **rowSystemMapping**: `number`[]

Defined in: objects/datatypes.ts:34

***

### ud\_name

> **ud\_name**: `string`

Defined in: objects/datatypes.ts:31
