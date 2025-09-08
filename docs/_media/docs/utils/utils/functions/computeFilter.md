[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [utils/utils](../README.md) / computeFilter

# Function: computeFilter()

> **computeFilter**(`op`, `a`, `b`): `null` \| `boolean`

Defined in: utils/utils.ts:194

takes two booleans and returns their result based on the binary operation assigned
This doesn't work exactly as binary would because of the null "unset" value. In the case of unset's
we just pass through the value that isn't unset.

## Parameters

### op

`string`

the binary operator

### a

the first (top) value

`null` | `boolean`

### b

the second (under) value

`null` | `boolean`

## Returns

`null` \| `boolean`

boolean result
