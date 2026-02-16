---
title: selvedge
sidebar_label: selvedge
sidebar_class_name: helper opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/selvedge/selvedge.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='selvedge' />

## Parameters
- `ends` - how many ends of selvedge to add to each side of the draft
- `right shift` - shifts the pics of the selvedge on the right of the draft by the specified amount

## Inlets
- `draft` - the draft to wrap the selvedge around
- `selvedge` - the structure to use within the selvedge

## Application
Adding selvedges to the sides of the cloth maintains clean edges

## Developer
adacad id: `selvedge`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/selvedge/selvedge.ts
```