---
title: set weft materials
sidebar_label: set weft materials
sidebar_class_name: color opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/apply_weft_materials/apply_weft_materials.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='apply_weft_materials' />

## Parameters
- `weft colors shift` - can be used to shift the starting point of the repeating color pattern along the weft


## Inlets
- `draft` - the draft to which materials should be applied
- `weft materials` - the draft from which material information should be copied.  


## Application
Applying materials allows one to visualize the relationship between the draft and the color effects visible on the cloth's surface

## Developer
adacad id: `apply weft materials`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/apply_weft_materials/apply_weft_materials.ts
```