---
title: twill
sidebar_label: twill
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/twill/twill.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='twill' />

## Parameters
- `warps raised`: the number of warps raised along a base pattern pic 
- `warps lowered`: the number of lowered warps along the base pattern pic
- `S/Z`:  determines the direction of the twill produced.
- `facing`: a toggle to determine if the twill should be predominantly warp facing or weft facing. 


## Application
Generates a twill or twill derivative structure that can be modified as needed as ones design evolves.

## Developer
adacad id: `twill`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/twill/twill.ts
```