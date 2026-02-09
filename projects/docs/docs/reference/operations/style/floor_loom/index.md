---
title: generate floor loom threading and treadling
sidebar_label: generate floor loom threading and treadling
sidebar_class_name: style opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/floor_loom/floor_loom.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='floor_loom' />

## Parameters
- `frames` - the number of frames to use
- `treadles` - the number of treadles to use

:::info
this will decompose the drawdown into as few treadles and frames as possible. If that number is larger than the user specified parameters, the outcomes will use the larger size.
:::

## Application
To create threading and treadlings plans from drawdowns
## Developer
adacad id: `floor loom`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/floor_loom/floor_loom.ts
```