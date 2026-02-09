---
title: undulating twill
sidebar_label: undulating twill
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/undulating_twill/undulating_twill.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='undulating_twill' />

## Parameters
- `first pic pattern`: the number of warps to raise and lower in the pattern pic. For instance 1 3 1 3 is interpreted as 1 warp raised, 3 lowered, 1 raised, 3 lowered. The number of the picks in the structure is calculated as the sum of these values. 
- `shift pattern`: this sequence of numbers determines how many warps to shift the pattern pick on each subsequent pick. A value of 0 does not shift at all while a value of 3 would shift the original starting pattern 3 times to the right or left.
- `S/Z`:  determines if the shift on each pic moves to the right or left. 


## Application
Allows for the creation and customization of curving structures. 

## Developer
adacad id: `undulatingtwill`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/undulating_twill/undulating_twill.ts
```