---
title: extract loom data
sidebar_label: extract loom data
sidebar_class_name: style opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/extract/extract.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='extract' />

## Parameters
- `datasource`: the loom data to turn into a drawdown. Select `threading` to make a draft where each row is a frame and each column is a warp end, `treadling/lift plan` to make a draft where each row is a pick and each column is a treadle, or `tieup` to make a draft where each row is a frame and each column is a treadle.

:::info
On a direct tie loom there is no tieup to extract, so the `tieup` option returns a draft with the interlacements running along the diagonal.
:::

## Inlets
- `draft`: the draft from which to extract data. The draft must carry loom data, so a jacquard draft produces no output.

## Application
To work with the threading, treadling, lift plan, or tieup of a draft as a drawdown in its own right, so that it can be edited or fed into other operations and then recombined with [make drawdown from threading, tieup, and treadling](../drawdown/index.md).

## Developer
adacad id: `extract`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/extract/extract.ts
```
