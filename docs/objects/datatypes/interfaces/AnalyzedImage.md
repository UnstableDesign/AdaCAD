[**adacad-drafting-lib**](../../../README.md)

***

[adacad-drafting-lib](../../../modules.md) / [objects/datatypes](../README.md) / AnalyzedImage

# Interface: AnalyzedImage

Defined in: objects/datatypes.ts:561

an object that is stored in memory when an image is loaded

## Param

the file name of the uploaded file

## Param

the raw data of the image

## Param

an array of unique hex values found in this image

## Param

an array that matches each index in the color array to a color index that it should be grouped with

## Param

the HTML image object to write the data into

## Param

an 2D array associating every pixel in the image with the id of the associated color in the colors array

## Param

## Param

## Param

## Param

a text warning is added if the image file violates rules

## Properties

### colors

> **colors**: [`Color`](Color.md)[]

Defined in: objects/datatypes.ts:564

***

### colors\_mapping

> **colors\_mapping**: `object`[]

Defined in: objects/datatypes.ts:565

#### from

> **from**: `number`

#### to

> **to**: `number`

***

### data

> **data**: `ImageData`

Defined in: objects/datatypes.ts:563

***

### height

> **height**: `number`

Defined in: objects/datatypes.ts:570

***

### image

> **image**: `HTMLImageElement`

Defined in: objects/datatypes.ts:567

***

### image\_map

> **image\_map**: `number`[][]

Defined in: objects/datatypes.ts:568

***

### name

> **name**: `string`

Defined in: objects/datatypes.ts:562

***

### proximity\_map

> **proximity\_map**: `object`[]

Defined in: objects/datatypes.ts:566

#### a

> **a**: `number`

#### b

> **b**: `number`

#### dist

> **dist**: `number`

***

### type

> **type**: `string`

Defined in: objects/datatypes.ts:571

***

### warning

> **warning**: `string`

Defined in: objects/datatypes.ts:572

***

### width

> **width**: `number`

Defined in: objects/datatypes.ts:569
