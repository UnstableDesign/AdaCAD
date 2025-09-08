[**adacad-drafting-lib**](../../../../../README.md)

***

[adacad-drafting-lib](../../../../../modules.md) / [objects/sequence](../../../README.md) / [Sequence](../README.md) / OneD

# Class: OneD

Defined in: objects/sequence.ts:10

## Constructors

### Constructor

> **new OneD**(`initSequence?`): `OneD`

Defined in: objects/sequence.ts:14

#### Parameters

##### initSequence?

`number`[]

#### Returns

`OneD`

## Methods

### computeFilter()

> **computeFilter**(`filter`, `seq`): `OneD`

Defined in: objects/sequence.ts:215

#### Parameters

##### filter

`string`

##### seq

`OneD`

#### Returns

`OneD`

***

### deleteAndDrawIn()

> **deleteAndDrawIn**(`val`): `OneD`

Defined in: objects/sequence.ts:187

#### Parameters

##### val

`number`

#### Returns

`OneD`

***

### get()

> **get**(`i`): `number`

Defined in: objects/sequence.ts:293

gets the value at a specified position

#### Parameters

##### i

`number`

#### Returns

`number`

the value at this location, or -1 if the location was invalid

***

### import()

> **import**(`row`): `OneD`

Defined in: objects/sequence.ts:162

clears the current state and pushes a new row into the state value

#### Parameters

##### row

[`Cell`](../../../../datatypes/interfaces/Cell.md)[] | `number`[]

#### Returns

`OneD`

***

### invert()

> **invert**(): `OneD`

Defined in: objects/sequence.ts:139

inverts all of the values of the current state

#### Returns

`OneD`

***

### length()

> **length**(): `number`

Defined in: objects/sequence.ts:331

returns the length of the given state

#### Returns

`number`

a number 0 or above

***

### matchSize()

> **matchSize**(`seq`): `OneD`

Defined in: objects/sequence.ts:204

given a sequence as input. It makes sure the current state and the sequence submitted to the function are modified to be the same length. They are made the same length by appending unset values to the sequence.

#### Parameters

##### seq

`OneD`

#### Returns

`OneD`

***

### padTo()

> **padTo**(`n`): `undefined` \| `OneD`

Defined in: objects/sequence.ts:119

adds unset cells so that it is of length n.

#### Parameters

##### n

`number`

the length of the sequence

#### Returns

`undefined` \| `OneD`

***

### push()

> **push**(`val`): `OneD`

Defined in: objects/sequence.ts:49

pushes a new value to the current sequence state

#### Parameters

##### val

can accept a number or boolean.

`null` | `number` | `boolean`

#### Returns

`OneD`

***

### pushMultiple()

> **pushMultiple**(`push_val`, `multiple`): `OneD`

Defined in: objects/sequence.ts:71

#### Parameters

##### push\_val

`number` | `boolean`

##### multiple

`number`

#### Returns

`OneD`

***

### pushRow()

> **pushRow**(`row`): `OneD`

Defined in: objects/sequence.ts:177

pushes a new row into the state value without clearing the state

#### Parameters

##### row

[`Cell`](../../../../datatypes/interfaces/Cell.md)[] | `number`[]

#### Returns

`OneD`

***

### repeat()

> **repeat**(`val`): `undefined` \| `OneD`

Defined in: objects/sequence.ts:266

repeats the sequence val times returning a sequence of size val * original sequence

#### Parameters

##### val

`number`

the number of times you would like to repeat. 1 returns itself. 0 returns nothing

#### Returns

`undefined` \| `OneD`

***

### resize()

> **resize**(`n`): `OneD`

Defined in: objects/sequence.ts:95

repeats or cuts the current sequence so that it is of length n.

#### Parameters

##### n

`number`

the length of the sequence

#### Returns

`OneD`

***

### reverse()

> **reverse**(): `OneD`

Defined in: objects/sequence.ts:275

#### Returns

`OneD`

***

### set()

> **set**(`i`, `val`): `OneD`

Defined in: objects/sequence.ts:302

gets the value at a specified position

#### Parameters

##### i

`number`

##### val

`number` | `boolean`

#### Returns

`OneD`

the value at this location, or -1 if the location was invalid

***

### shift()

> **shift**(`val`): `OneD`

Defined in: objects/sequence.ts:252

shifts the sequence in the amount of val

#### Parameters

##### val

`number`

a positive or negative number that controls the direction of the shift

#### Returns

`OneD`

***

### slice()

> **slice**(`start`, `end`): `OneD`

Defined in: objects/sequence.ts:151

slices a portion of the sequence

#### Parameters

##### start

`number`

##### end

`number`

#### Returns

`OneD`

***

### unshift()

> **unshift**(`val`): `OneD`

Defined in: objects/sequence.ts:25

adds a new value to the front of current sequence state

#### Parameters

##### val

can accept a number or boolean.

`number` | `boolean`

#### Returns

`OneD`

***

### unshiftMultiple()

> **unshiftMultiple**(`push_val`, `multiple`): `OneD`

Defined in: objects/sequence.ts:80

#### Parameters

##### push\_val

`number` | `boolean`

##### multiple

`number`

#### Returns

`OneD`

***

### val()

> **val**(): `number`[]

Defined in: objects/sequence.ts:285

provides the value of the state at this given moment of computation.

#### Returns

`number`[]

the sequence as a numeric array
