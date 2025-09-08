[**adacad-drafting-lib**](../../../../../README.md)

***

[adacad-drafting-lib](../../../../../modules.md) / [objects/sequence](../../../README.md) / [Sequence](../README.md) / TwoD

# Class: TwoD

Defined in: objects/sequence.ts:336

## Constructors

### Constructor

> **new TwoD**(): `TwoD`

Defined in: objects/sequence.ts:341

#### Returns

`TwoD`

## Methods

### copy()

> **copy**(): `TwoD`

Defined in: objects/sequence.ts:852

#### Returns

`TwoD`

***

### deleteWarp()

> **deleteWarp**(`j`): `TwoD`

Defined in: objects/sequence.ts:352

#### Parameters

##### j

`number`

#### Returns

`TwoD`

***

### deleteWeft()

> **deleteWeft**(`i`): `TwoD`

Defined in: objects/sequence.ts:347

#### Parameters

##### i

`number`

#### Returns

`TwoD`

***

### export()

> **export**(): [`Drawdown`](../../../../datatypes/type-aliases/Drawdown.md)

Defined in: objects/sequence.ts:882

converts the current state to a drawdown format

#### Returns

[`Drawdown`](../../../../datatypes/type-aliases/Drawdown.md)

***

### fill()

> **fill**(`w`, `h`): `TwoD`

Defined in: objects/sequence.ts:826

fills a rectangle of given size with the current state. If the rectangle specified is smaller than state, it crops the current state

#### Parameters

##### w

`number`

the width

##### h

`number`

the hieght

#### Returns

`TwoD`

***

### get()

> **get**(`i`, `j`): `number`

Defined in: objects/sequence.ts:639

#### Parameters

##### i

`number`

##### j

`number`

#### Returns

`number`

***

### getWarp()

> **getWarp**(`j`): `number`[]

Defined in: objects/sequence.ts:664

#### Parameters

##### j

`number`

#### Returns

`number`[]

***

### getWeft()

> **getWeft**(`i`): `number`[]

Defined in: objects/sequence.ts:654

#### Parameters

##### i

`number`

#### Returns

`number`[]

***

### import()

> **import**(`dd`): `TwoD`

Defined in: objects/sequence.ts:867

clears the current state (if any)
and creates a new 2D Sequence Object from a DD

#### Parameters

##### dd

[`Drawdown`](../../../../datatypes/type-aliases/Drawdown.md)

#### Returns

`TwoD`

***

### mapToSystems()

> **mapToSystems**(`weftsys`, `warpsys`, `weft_system_map`, `warp_system_map`, `ends`, `pics`): `TwoD`

Defined in: objects/sequence.ts:368

uses the current state to populate a new space, but only upon a certain set of warps and wefts.

#### Parameters

##### weftsys

`number`[]

the weft system upon which to map this draft

##### warpsys

`number`[]

the warp system upon which to map this draft

##### weft\_system\_map

[`OneD`](OneD.md)

the pattern of weft systems along the wefts

##### warp\_system\_map

[`OneD`](OneD.md)

##### ends

`number`

the number of ends required in the output structure (based on the lcm of input warps)

##### pics

`number`

the number of picks required in the output structure (based on the lcm of input wefts)

#### Returns

`TwoD`

***

### mapToWarpSystems()

> **mapToWarpSystems**(`warpsys`, `weft_system_map`, `warp_system_map`, `ends`, `pics`): `TwoD`

Defined in: objects/sequence.ts:413

used to assign a structure to every weft system associated with a given warp system

#### Parameters

##### warpsys

`number`[]

##### weft\_system\_map

[`OneD`](OneD.md)

##### warp\_system\_map

[`OneD`](OneD.md)

##### ends

`number`

##### pics

`number`

#### Returns

`TwoD`

***

### mapToWeftSystems()

> **mapToWeftSystems**(`weftsys`, `weft_system_map`, `warp_system_map`, `ends`, `pics`): `TwoD`

Defined in: objects/sequence.ts:452

used to handle layers that are composed only of floats, this function writes this stored sequence accross all warp systems

#### Parameters

##### weftsys

`number`[]

##### weft\_system\_map

[`OneD`](OneD.md)

##### warp\_system\_map

[`OneD`](OneD.md)

##### ends

`number`

##### pics

`number`

#### Returns

`TwoD`

***

### overlay()

> **overlay**(`seq`, `consider_heddle_down_as_unset`): `TwoD`

Defined in: objects/sequence.ts:488

places the non unset values from seq atop any unset values in the current state. It will also make the two sequences compatable sizes by repeating their original values.

#### Parameters

##### seq

`TwoD`

##### consider\_heddle\_down\_as\_unset

`boolean`

#### Returns

`TwoD`

***

### placeInLayerStack()

> **placeInLayerStack**(`cur_warp_sys`, `warp_sys_above`, `cur_weft_sys`, `weft_sys_above`, `weft_system_map`, `warp_system_map`): `TwoD`

Defined in: objects/sequence.ts:568

given a current warp and weft system, as well as a list of the weft and warp systems that have been assigned to layers "above" the current warp and weft system, this function will ensure that structures are assigned such that they fall just under the previous layers in the layer stack

#### Parameters

##### cur\_warp\_sys

`number`[]

the current warp systems we are considering

##### warp\_sys\_above

`number`[]

the warp systems that have been used in previous layers above this layer

##### cur\_weft\_sys

`number`[]

the current weft systems we are considering

##### weft\_sys\_above

`number`[]

the weft systems that have been used in previous layers above this layer

##### weft\_system\_map

[`OneD`](OneD.md)

a map of the weft systems used in this draft

##### warp\_system\_map

[`OneD`](OneD.md)

a map of the warp systems used in this draft

#### Returns

`TwoD`

***

### pushWarpSequence()

> **pushWarpSequence**(`seq`): `TwoD`

Defined in: objects/sequence.ts:682

adds a row to the first (or subsequent row) of the 2D sequence

#### Parameters

##### seq

`number`[]

the 1D sequence value to add

#### Returns

`TwoD`

***

### pushWeftSequence()

> **pushWeftSequence**(`seq`): `TwoD`

Defined in: objects/sequence.ts:761

adds a col to the first (or subsequent col) of the 2D sequence

#### Parameters

##### seq

`number`[]

the 1D sequence value to add

#### Returns

`TwoD`

***

### set()

> **set**(`i`, `j`, `val`, `can_overwrite_set`): `TwoD`

Defined in: objects/sequence.ts:619

this sets the value at a given location specified by i and j
This function will only succesfully set a value if the current value in that place is "unset", otherwise it returns an error that it is attempting to overwrite a value

#### Parameters

##### i

`number`

##### j

`number`

##### val

`number`

##### can\_overwrite\_set

`boolean`

#### Returns

`TwoD`

***

### setBlank()

> **setBlank**(`val`): `TwoD`

Defined in: objects/sequence.ts:804

#### Parameters

##### val

`number` | `boolean`

#### Returns

`TwoD`

***

### setUnsetOnWarp()

> **setUnsetOnWarp**(`j`, `val`): `TwoD`

Defined in: objects/sequence.ts:545

looks at the given warp. Sets any unset value in this warp to the value provided to the function

#### Parameters

##### j

`number`

##### val

`number`

#### Returns

`TwoD`

***

### setUnsetOnWeft()

> **setUnsetOnWeft**(`i`, `val`): `TwoD`

Defined in: objects/sequence.ts:530

looks at the given weft. Sets any unset value in this weft to the value provided to the function

#### Parameters

##### i

`number`

##### val

`number`

#### Returns

`TwoD`

***

### unshiftWarpSequence()

> **unshiftWarpSequence**(`seq`): `TwoD`

Defined in: objects/sequence.ts:726

adds this weft to the front of the pattern

#### Parameters

##### seq

`number`[]

the 1D sequence value to add

#### Returns

`TwoD`

***

### unshiftWeftSequence()

> **unshiftWeftSequence**(`seq`): `TwoD`

Defined in: objects/sequence.ts:785

adds this weft to the front of the pattern

#### Parameters

##### seq

`number`[]

the 1D sequence value to add

#### Returns

`TwoD`

***

### warps()

> **warps**(): `number`

Defined in: objects/sequence.ts:815

#### Returns

`number`

***

### wefts()

> **wefts**(): `number`

Defined in: objects/sequence.ts:811

#### Returns

`number`
