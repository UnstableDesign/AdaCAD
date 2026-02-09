---
title: waffle
sidebar_label: waffle
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/waffle/waffle.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='waffle' />

## Parameters
- `float length`: the length of the longest float in the waffle structure. Must be an odd number (and if even, will round down to the closest odd number)
- `binding rows`: this the number of tabby borders around the central diamond. 
- `packing`: crops the structure to control how tightly the floating regions in the design will be packed together when tiled. 



## Application
Generates a waffle  structure that can be modified as needed as ones design evolves.

## Developer
adacad id: `waffle`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/waffle/waffle.ts
```