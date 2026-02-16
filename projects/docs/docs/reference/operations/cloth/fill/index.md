---
title: fill
sidebar_label: fill
sidebar_class_name: cloth opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/fill/fill.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='fill' />

## Parameters
- none



## Inlets
- `pattern`: a draft describing the regions you would like to fill (or replace) with the input structure
- `black cell structure`: the structure to replace all black (warp raised) cells with
- `white cell structure`: the structure to replace all white (warp raised) interlacements with


## Application
Fill can be used to create graphic regions on cloth. For instance, the input draft can contain a simple graphic drawn in black/warp raised cells, the fill operation then, can fill the black cells with a structure, such as a shaded satin, so that the heart is visible and well structured on the resulting cloth.

## Developer
adacad id: `fill`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/fill/fill.ts
```