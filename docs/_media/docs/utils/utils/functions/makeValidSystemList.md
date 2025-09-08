[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [utils/utils](../README.md) / makeValidSystemList

# Function: makeValidSystemList()

> **makeValidSystemList**(`input_systems`, `original_systems`): [`SystemList`](../../../objects/datatypes/interfaces/SystemList.md)

Defined in: utils/utils.ts:641

used by operations that parse a string input meant to represent a set of warp and weft systems. This checks if the systems input are valid in terms of the systems that draft will be using,

## Parameters

### input\_systems

[`SystemList`](../../../objects/datatypes/interfaces/SystemList.md)

{wesy: Array<string>, wasy: Array<string>}

### original\_systems

[`SystemList`](../../../objects/datatypes/interfaces/SystemList.md)

{wesy: Array<string>, wasy: Array<string>}

## Returns

[`SystemList`](../../../objects/datatypes/interfaces/SystemList.md)
