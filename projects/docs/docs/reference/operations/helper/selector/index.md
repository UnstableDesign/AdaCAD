---
title: selector
sidebar_label: selector
sidebar_class_name: helper opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/selector/selector.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='selector' />

## Parameters
- `selected input` - controls which draft is passed through to the output. 1 connects to the draft attached to the first inlet, 2 connects to the draft attached to the second inlet, and so on. If you select a number that is higher than the number of drafts commented, an empty draft will pass through. 

## Inlets
- `draft` - accepts a single draft. Each time a draft is added, a new inlet will generate for another draft to attach. 

## Application
To control the draft that is supplied to a large number of inputs at once rather than having to add and remove individual connections

## Developer
adacad id: `selector`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/selector/selector.ts
```