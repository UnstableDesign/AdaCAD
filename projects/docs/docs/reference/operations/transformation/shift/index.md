---
title: shift
sidebar_label: shift
sidebar_class_name: transformation opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/shift/shift.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='shift' />

## Parameters
- `warps`: a number that describes how may warp ends to the right the pattern should move
- `wefts`: a number that describes how may weft pics the pattern should move down.


## Application
Creates a version of a draft that is structurally identical, but has the placement of interlacements fine tuned in relation to other structures

## Developer
adacad id: `shift`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/shift/shift.ts
```