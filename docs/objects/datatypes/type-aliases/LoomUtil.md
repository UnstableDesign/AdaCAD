[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / LoomUtil

# Type Alias: LoomUtil

> **LoomUtil** = `object`

Defined in: objects/datatypes.ts:246

Store each loom type as a different unit that computes functions based on its particular settings

## Param

an identifer relating to the currently supported types

## Param

the name to show with this loom type

## Param

the description for this type of loom

## Param

a function to execute when a single cell is modified within the Threading

## Param

a function to execute when a single cell is modified within the Treadling

## Param

a function to execute when a single cell is modified within the Tieup

## Param

a function to execute when a single cell is modified within the Threading

## Param

a function to execute when a single cell is modified within the Treadling

## Param

a function to execute when a single cell is modified within the Tieup

## Properties

### computeDrawdownFromLoom()?

> `optional` **computeDrawdownFromLoom**: (`l`) => `Promise`\<[`Drawdown`](Drawdown.md)\>

Defined in: objects/datatypes.ts:251

#### Parameters

##### l

[`Loom`](Loom.md)

#### Returns

`Promise`\<[`Drawdown`](Drawdown.md)\>

***

### computeLoomFromDrawdown()?

> `optional` **computeLoomFromDrawdown**: (`d`, `loom_settings`) => `Promise`\<[`Loom`](Loom.md)\>

Defined in: objects/datatypes.ts:250

#### Parameters

##### d

[`Drawdown`](Drawdown.md)

##### loom\_settings

[`LoomSettings`](LoomSettings.md)

#### Returns

`Promise`\<[`Loom`](Loom.md)\>

***

### deleteFromThreading()?

> `optional` **deleteFromThreading**: (`l`, `j`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:258

#### Parameters

##### l

[`Loom`](Loom.md)

##### j

`number`

#### Returns

[`Loom`](Loom.md)

***

### deleteFromTreadling()?

> `optional` **deleteFromTreadling**: (`l`, `i`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:259

#### Parameters

##### l

[`Loom`](Loom.md)

##### i

`number`

#### Returns

[`Loom`](Loom.md)

***

### displayname

> **displayname**: `string`

Defined in: objects/datatypes.ts:248

***

### dx

> **dx**: `string`

Defined in: objects/datatypes.ts:249

***

### getDressingInfo()

> **getDressingInfo**: (`dd`, `l`, `ls`) => `object`[]

Defined in: objects/datatypes.ts:263

#### Parameters

##### dd

[`Drawdown`](Drawdown.md)

##### l

[`Loom`](Loom.md)

##### ls

[`LoomSettings`](LoomSettings.md)

#### Returns

`object`[]

***

### insertIntoThreading()?

> `optional` **insertIntoThreading**: (`l`, `j`, `val`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:256

#### Parameters

##### l

[`Loom`](Loom.md)

##### j

`number`

##### val

`number`

#### Returns

[`Loom`](Loom.md)

***

### insertIntoTreadling()?

> `optional` **insertIntoTreadling**: (`l`, `i`, `val`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:257

#### Parameters

##### l

[`Loom`](Loom.md)

##### i

`number`

##### val

`number`[]

#### Returns

[`Loom`](Loom.md)

***

### pasteThreading()?

> `optional` **pasteThreading**: (`l`, `drawdown`, `ndx`, `width`, `height`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:260

#### Parameters

##### l

[`Loom`](Loom.md)

##### drawdown

[`Drawdown`](Drawdown.md)

##### ndx

[`InterlacementVal`](../interfaces/InterlacementVal.md)

##### width

`number`

##### height

`number`

#### Returns

[`Loom`](Loom.md)

***

### pasteTieup()?

> `optional` **pasteTieup**: (`l`, `drawdown`, `ndx`, `width`, `height`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:262

#### Parameters

##### l

[`Loom`](Loom.md)

##### drawdown

[`Drawdown`](Drawdown.md)

##### ndx

[`InterlacementVal`](../interfaces/InterlacementVal.md)

##### width

`number`

##### height

`number`

#### Returns

[`Loom`](Loom.md)

***

### pasteTreadling()?

> `optional` **pasteTreadling**: (`l`, `drawdown`, `ndx`, `width`, `height`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:261

#### Parameters

##### l

[`Loom`](Loom.md)

##### drawdown

[`Drawdown`](Drawdown.md)

##### ndx

[`InterlacementVal`](../interfaces/InterlacementVal.md)

##### width

`number`

##### height

`number`

#### Returns

[`Loom`](Loom.md)

***

### recomputeLoomFromThreadingAndDrawdown()?

> `optional` **recomputeLoomFromThreadingAndDrawdown**: (`l`, `loom_settings`, `d`) => `Promise`\<[`Loom`](Loom.md)\>

Defined in: objects/datatypes.ts:252

#### Parameters

##### l

[`Loom`](Loom.md)

##### loom\_settings

[`LoomSettings`](LoomSettings.md)

##### d

[`Drawdown`](Drawdown.md)

#### Returns

`Promise`\<[`Loom`](Loom.md)\>

***

### type

> **type**: `"jacquard"` \| `"frame"` \| `"direct"`

Defined in: objects/datatypes.ts:247

***

### updateThreading()?

> `optional` **updateThreading**: (`l`, `ndx`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:253

#### Parameters

##### l

[`Loom`](Loom.md)

##### ndx

[`InterlacementVal`](../interfaces/InterlacementVal.md)

#### Returns

[`Loom`](Loom.md)

***

### updateTieup()?

> `optional` **updateTieup**: (`l`, `ndx`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:255

#### Parameters

##### l

[`Loom`](Loom.md)

##### ndx

[`InterlacementVal`](../interfaces/InterlacementVal.md)

#### Returns

[`Loom`](Loom.md)

***

### updateTreadling()?

> `optional` **updateTreadling**: (`l`, `ndx`) => [`Loom`](Loom.md)

Defined in: objects/datatypes.ts:254

#### Parameters

##### l

[`Loom`](Loom.md)

##### ndx

[`InterlacementVal`](../interfaces/InterlacementVal.md)

#### Returns

[`Loom`](Loom.md)
