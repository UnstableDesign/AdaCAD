[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/looms](../README.md) / generateTreadlingforFrameLoom

# Function: generateTreadlingforFrameLoom()

> **generateTreadlingforFrameLoom**(`pattern`): `Promise`\<\{ `num`: `number`; `treadling`: `number`[][]; \}\>

Defined in: objects/looms.ts:239

This function sets the treadling based on a adjusted pattern (e.g. a pattern that has been flipped based on the users selected origin point)

## Parameters

### pattern

[`Drawdown`](../../datatypes/type-aliases/Drawdown.md)

the drawdown to use to generate the treadling

## Returns

`Promise`\<\{ `num`: `number`; `treadling`: `number`[][]; \}\>

an object containing the treadling and the total number of treadles used
