---
title: aster
sidebar_label: aster
sidebar_class_name: cloth opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/aster/aster.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='aster' />

## Parameters
- `center type`: the shape of the flower center, either a rectangle or a stepped diamond. Use equal width and height for a square center.
- `center width`: the width of the center in blocks, where one block is one repeat of the input structure. For a diamond, the size across.
- `center height`: the height of the center in blocks. Not used by the diamond.
- `petal length`: the length of each petal in blocks. The structure in each petal is stretched by this amount, so longer petals make longer floats (1 = no stretch).
- `corner petal`: fills the corners between petals with both stretches laid on top of each other. For a rectangle, adds a vertical and a horizontal strip in each corner. For a diamond, fills the notches on the outer edge where two petals meet.


## Inlets
- `structure`: the structure that fills each block of the flower. Its size sets the size of one block.


## Application
Aster draws a compound flower made of blocks of one structure. The center holds the structure as it is, and the size of the center determines how many times the structure is repeated. The north and south petals hold the structure stretched along the warp (creating long warp floats), and the east and west petals hold it stretched along the weft (creating long weft floats). For example, when the input structure is a twill, the center shows the twill repeated to the specified width and height and the petals show stripes of warp floats and weft floats around it, much like a hand-carved stamp print of an aster. The center can take the form of a rectangle or a diamond.

Cells outside the flower are left unset, so the result can be placed on a ground structure, tiled, or overlapped with other operations.

## Developer
adacad id: `aster`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/aster/aster.ts
```
