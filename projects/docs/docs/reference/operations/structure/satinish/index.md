---
title: satinish
sidebar_label: satinish
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/satinish/satinish.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='satinish' />

## Parameters
- `pattern`: a sequence of numbers, separated by a space, that describes the repeating pattern. For example, 2 2 3 3 creates the repeating pattern of having 2 warps raised, then 2 lowered, then 3 raised, then 3 lowered. 
- `shift`: the number of warps to shift the structure on each subsequent pick. 
- `S/Z`: determines the direction of the shift on each row. 



## Application
Allows for the creation and customization of satin or steep twill structures by shifting more than 1 end to the left or right on each subsequence pic. 

## Developer
adacad id: `satinish`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/satinish/satinish.ts
```