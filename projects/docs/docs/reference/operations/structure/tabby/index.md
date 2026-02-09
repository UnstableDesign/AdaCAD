---
title: tabby
sidebar_label: tabby
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/tabby/tabby.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='tabby' />

## Parameters
- `warps raised`: sets the number of consecutive warps raised on the first/base pic.
- `warps lowered`: sets the number of consecutive warps lowered on the first/base pic.
- `base pics`: the number or repeats to make of the base pic.
- `alt pics`: the number of repeats to make of the opposite, or inverse, of the base pattern.

## Application
Generates a tabby or tabby derivative structure that can be modified as needed as ones design evolves.

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/tabby/tabby.ts
```