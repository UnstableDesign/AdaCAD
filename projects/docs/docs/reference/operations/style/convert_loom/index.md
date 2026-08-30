---
title: convert loom types
sidebar_label: convert loom types
sidebar_class_name: style opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/convert_loom/convert_loom.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='convert_loom' />

## Parameters
- `convert to`: the loom type to produce. Select `frame` to turn a lift plan into a tieup and treadling for a floor loom, or `direct` to flatten a tieup and treadling into a lift plan for a direct tie loom.

:::info
The drawdown is never changed by this operation, only the threading, tieup, treadling, and lift plan used to weave it. A draft that is already the requested loom type passes through untouched, and a jacquard draft produces no output because it has no frames or treadles to convert.
:::

## Inlets
- `draft`: the draft and loom to convert.

## Application
To move a draft between the floor loom and direct tie loom drafting conventions, for instance when a draft was written for one loom but needs to be woven on another.

## Developer
adacad id: `convert_loom`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/convert_loom/convert_loom.ts
```
