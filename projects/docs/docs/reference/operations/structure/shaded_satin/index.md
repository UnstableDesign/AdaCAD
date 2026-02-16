---
title: shaded satin
sidebar_label: shaded satin
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/shaded_satin/shaded_satin.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='shaded_satin' />

## Parameters
- `pattern`: a sequence of numbers, separated by a space, that describes the repeating pattern. For example, 2 2 3 3 creates the repeating pattern of having 2 warps raised, then 2 lowered, then 3 raised, then 3 lowered. 
- `shift`: the number of warps to shift the structure on each subsequent pick. 
- `S/Z`: determines the direction of the shift on each row.



## Application
Generates a satin or shaded satin structure that can be modified as needed as ones design evolves. Shaded satins are often used to create gradient color effects between the warp and weft colorways. 

## Developer
adacad id: `shaded_satin`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/shaded_satin/shaded_satin.ts
```