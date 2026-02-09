---
title: make drawdown from threading and lift plan
sidebar_label: make drawdown from threading and lift plan
sidebar_class_name: style opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/directdrawdown/directdrawdown.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='directdrawdown' />

## Parameters
- none

## Inlets
- `threading`: the draft to use as the threading. If more than one black cell is found in any column, the algorithm will only look at the one closest to the origin.
- `lift plan`: the draft as a lift plan. 

## Application
To create drawdown from from a direct loom plan

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/directdrawdown/directdrawdown.ts
```