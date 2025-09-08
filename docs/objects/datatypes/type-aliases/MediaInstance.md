[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / MediaInstance

# Type Alias: MediaInstance

> **MediaInstance** = `object`

Defined in: objects/datatypes.ts:323

a media object is something a user uploads for manipulation in AdaCAD that is stored on the Firebase server
a media object belongs to a user and eventually can be used across file contexts

## Param

a unique id that refers to only this media object instance

## Param

the reference id used to find the media object in storage

## Param

a flag to determine which type of media this is

## Properties

### id

> **id**: `number`

Defined in: objects/datatypes.ts:324

***

### img

> **img**: [`IndexedColorImageInstance`](IndexedColorImageInstance.md) \| [`SingleImage`](../interfaces/SingleImage.md)

Defined in: objects/datatypes.ts:327

***

### ref

> **ref**: `string`

Defined in: objects/datatypes.ts:325

***

### type

> **type**: `"image"` \| `"indexed_color_image"`

Defined in: objects/datatypes.ts:326
