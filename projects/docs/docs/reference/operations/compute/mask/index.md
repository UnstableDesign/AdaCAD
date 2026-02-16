---
title: mask, (a,b) => (a AND b)
sidebar_label: mask, (a,b) => (a AND b)
sidebar_class_name: compute opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/mask/mask.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='mask' />

## Parameters
- `shift ends`: shifts the position of the ends in draft b relative to a
- `shift pics`: shifts the position of the pics in draft b relative to b

## Application
No established application, but a fun way to see how to apply binary math to the production of drafts. Retains input draft b in regions where input draft a has raised warp ends (black cells); draft b is only retained within the area of draft a.

## Developer
adacad id: `mask`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/mask/mask.ts
```