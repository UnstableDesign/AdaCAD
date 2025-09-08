[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / Operation

# Type Alias: Operation

> **Operation** = `object`

Defined in: objects/datatypes.ts:509

a standard opeartion

## Param

the internal name of this opearation (CHANGING THESE WILL BREAK LEGACY VERSIONS)

## Param

the name to show upon this operation in the interface

## Param

the description of this operation

## Param

the parameters associated with this operation

## Param

the inlets associated with this operation

## Param

referes to any prior name of this operation to aid when loading old files

## Param

a function that executes when this operation is performed, takes a series of inputs and resturns an array of drafts

## Param

a function that computes the system provided name default based on the inputs. a number can be passed in args to handle cases where the operation needs to assign different names to different draft outputs

## Properties

### generateName()

> **generateName**: (`op_settings`, `op_inputs`) => `string`

Defined in: objects/datatypes.ts:515

#### Parameters

##### op\_settings

[`OpParamVal`](../interfaces/OpParamVal.md)[]

##### op\_inputs

[`OpInput`](../interfaces/OpInput.md)[]

#### Returns

`string`

***

### inlets

> **inlets**: [`OperationInlet`](OperationInlet.md)[]

Defined in: objects/datatypes.ts:512

***

### name

> **name**: `string`

Defined in: objects/datatypes.ts:510

***

### old\_names

> **old\_names**: `string`[]

Defined in: objects/datatypes.ts:513

***

### params

> **params**: [`OperationParam`](OperationParam.md)[]

Defined in: objects/datatypes.ts:511

***

### perform()

> **perform**: (`op_settings`, `op_inputs`) => `Promise`\<[`Draft`](../interfaces/Draft.md)[]\>

Defined in: objects/datatypes.ts:514

#### Parameters

##### op\_settings

[`OpParamVal`](../interfaces/OpParamVal.md)[]

##### op\_inputs

[`OpInput`](../interfaces/OpInput.md)[]

#### Returns

`Promise`\<[`Draft`](../interfaces/Draft.md)[]\>
