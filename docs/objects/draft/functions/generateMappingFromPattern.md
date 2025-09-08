[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/draft](../README.md) / generateMappingFromPattern

# Function: generateMappingFromPattern()

> **generateMappingFromPattern**(`drawdown`, `pattern`, `type`): `number`[]

Defined in: objects/draft.ts:823

generates a system or shuttle mapping from an input pattern based on the input draft

## Parameters

### drawdown

[`Drawdown`](../../datatypes/type-aliases/Drawdown.md)

the drawdown for which we are creating this mapping

### pattern

`number`[]

the repeating pattern to use when creating the mapping

### type

`string`

specify if this is a 'row'/weft or 'col'/warp mapping

## Returns

`number`[]

the mapping to use
