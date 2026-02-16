---
title: set warp materials
sidebar_label: set warp materials
sidebar_class_name: color opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/apply_warp_materials/apply_warp_materials.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='apply_warp_materials' />

## Parameters
- `warp colors shift` - can be used to shift the starting point of the repeating color pattern along the warp

## Inlets
- `draft` - the draft to which materials should be applied
- `warp materials` - the draft from which material information should be copied.  



## Application
Applying materials allows one to visualize the relationship between the draft and the color effects visible on the cloth's surface

## Developer
adacad id: `apply warp materials`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/apply_warp_materials/apply_warp_materials.ts
```