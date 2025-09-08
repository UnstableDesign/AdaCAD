[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / StringParam

# Type Alias: StringParam

> **StringParam** = [`OperationParam`](OperationParam.md) & `object`

Defined in: objects/datatypes.ts:469

An extension of Param that handles extra requirements for strings as inputs

## Type Declaration

### error

> **error**: `string`

### regex

> **regex**: `RegExp`

## Param

strings must come with a regex used to validate their structure
 * test and make regex using RegEx101 website
 * do not use global (g) flag, as it creates unpredictable results in test functions used to validate inputs

## Param

the error message to show the user if the string is invalid
