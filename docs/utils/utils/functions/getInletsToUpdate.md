[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [utils/utils](../README.md) / getInletsToUpdate

# Function: getInletsToUpdate()

> **getInletsToUpdate**(`newInlets`, `currentInlets`): `object`

Defined in: utils/utils.ts:512

compares two lists of values and returns a list of the elements from newInlets that need to be added to the current list, 
as well as the elements in currentInlets that no longer need to exist.

## Parameters

### newInlets

[`OperationInlet`](../../../objects/datatypes/type-aliases/OperationInlet.md)[]

### currentInlets

[`OperationInlet`](../../../objects/datatypes/type-aliases/OperationInlet.md)[]

## Returns

`object`

the list of elements that needed to be added to or removed from current Inlets to make it match the list in newInlets

### toadd

> **toadd**: [`OperationInlet`](../../../objects/datatypes/type-aliases/OperationInlet.md)[]

### toremove

> **toremove**: [`OperationInlet`](../../../objects/datatypes/type-aliases/OperationInlet.md)[]
