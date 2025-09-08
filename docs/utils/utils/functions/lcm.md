[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [utils/utils](../README.md) / lcm

# Function: lcm()

> **lcm**(`original`): `number`

Defined in: utils/utils.ts:453

this is an algorithm for finding the least common multiple of a give set of input numbers 
it works based on the formula lcd (a,b) = a*b / gcd(a,b), and then calculates in a pairwise fashion.
this has the risk of breaking with very large sets of inputs and/or prime numbers of a large size

## Parameters

### original

`number`[]

## Returns

`number`
