---
title: satin
sidebar_label: satin
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/satin/satin.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='satin' />

## Parameters
- `repeat`: the size of the satin structure. In this operation, the satin generated always has one interlacement per pick. So, if 5 is selected as the repeat, the structure on each pick is represented by 1 warp raised and 4 warps lowered
- `shift`: the number of warps to shift the structure on each subsequent pick. Shifts always move to the right.  
- `facing`: determines if the structure if weft facing or warp facing. 

:::note
this operation will create both valid and invalid satins.  For example, if a shift number of 1 is entered, this operation generates a twill, not a satin. It is up to the user to verify the correctness of the structure they generate
:::

## Application
Satins are frequently used to shift the colors of a weave in different pattern regions. If you use this satins to fill regions of a design, this operation allows you to edit and modify those satins and visualize how they affect the design. 

## Developer
adacad id: `satin`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/satin/satin.ts
```