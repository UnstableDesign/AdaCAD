---
title: threading/treadling sequence
sidebar_label: threading/treadling sequence
sidebar_class_name: style opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/threading_treadling_sequence/threading_treadling_sequence.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='threading_treadling_sequence' />

## Parameters
- `sequence`: a list of numbers that represent the assignment of warps to frames. For exampple, the sequence 1 1 2 2 would create a draft whereby the first warp is in the first row, or frame, the second warp is also in the first frame, the third warp in the second frame, and so on. 
- `role`: describes if the sequence should be generated horizontally (as a threading), vertically (for a treadling), or both. 

## Inlets
- none

## Application
To quickly create blocks for threading and treadling from sequences of numbers, rather than clicking individual pixels. Can help when translating sequences from books or creating threading sequences from data sources. 

## Developer
adacad id: `threading_treadling_sequence`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/threading_treadling_sequence/threading_treadling_sequence.ts
```