[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / DynamicOperation

# Type Alias: DynamicOperation

> **DynamicOperation** = [`Operation`](Operation.md) & `object`

Defined in: objects/datatypes.ts:524

A container operation that takes drafts with some parameter assigned to them

## Type Declaration

### dynamic\_param\_id

> **dynamic\_param\_id**: `number`[]

### dynamic\_param\_type

> **dynamic\_param\_type**: `"number"` \| `"notation"` \| `"system"` \| `"color"` \| `"static"` \| `"draft"` \| `"profile"` \| `"null"`

### onParamChange()

> **onParamChange**: (`param_vals`, `static_inlets`, `inlet_vals`, `changed_param_id`, `dynamic_param_vals`) => [`OpInletValType`](OpInletValType.md)[]

#### Parameters

##### param\_vals

[`OpParamVal`](../interfaces/OpParamVal.md)[]

##### static\_inlets

[`OperationInlet`](OperationInlet.md)[]

##### inlet\_vals

[`OpInletValType`](OpInletValType.md)[]

##### changed\_param\_id

`number`

##### dynamic\_param\_vals

[`OpParamValType`](OpParamValType.md)[]

#### Returns

[`OpInletValType`](OpInletValType.md)[]

### perform()

> **perform**: (`param_vals`, `op_inputs`) => `Promise`\<[`Draft`](../interfaces/Draft.md)[]\>

#### Parameters

##### param\_vals

[`OpParamVal`](../interfaces/OpParamVal.md)[]

##### op\_inputs

[`OpInput`](../interfaces/OpInput.md)[]

#### Returns

`Promise`\<[`Draft`](../interfaces/Draft.md)[]\>

## Param

which parameter ids should we use to determine the number and value of parameterized input slots

## Param

dynamic parameters convert parameter inputs to inlets of a given type, this specifies the type of inlet created

## Param

a function that executes when a dynamic parameter is changed and returns the values for the inlets
