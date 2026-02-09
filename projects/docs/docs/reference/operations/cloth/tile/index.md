---
title: tile
sidebar_label: tile
sidebar_class_name: cloth opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/tile/tile.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='tile' />

## Parameters
- `warp-repeats`: the number of times to repeat the pattern to the width. 
- `weft-repeats`: the number of times to repeat the pattern along the length
- `mode`: provides an option to stagger the pattern across the warp or weft
- `offset`: the amount to stagger each unit (as a fraction 1/x)

## Application
Can be used to repeat a pattern across the cloth a specified number of times
## Developer
adacad id: `tile`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/tile/tile.ts
```