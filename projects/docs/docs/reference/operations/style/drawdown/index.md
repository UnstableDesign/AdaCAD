---
title: make drawdown from threading, tieup, and treadling
sidebar_label: make drawdown from threading, tieup, and treadling
sidebar_class_name: style opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/drawdown/drawdown.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='drawdown' />

## Parameters
- none

## Inlets
- `threading`: the draft to use as the threading. If more than one black cell is found in any column, the algorithm will only look at the one closest to the origin.
- `tieup`: the draft to use as the tieup
- `treadling`: the draft to use as the threading. If more than one black cell is found in any row, the algorithm will only look at the one closest to the origin.


## Application
To create drawdown from from a floor loom plan

## Developer
adacad id: `drawdown`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/drawdown/drawdown.ts
```