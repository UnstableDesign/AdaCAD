---
title: overlay, (a,b) => (a OR b)
sidebar_label: overlay, (a,b) => (a OR b)
sidebar_class_name: compute opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/overlay/overlay.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='overlay' />

## Parameters
- `shift ends`: shifts the position of the ends in draft a
- `shift pics`: shifts the position of the pics in draft a
- `calculate repeats`: this defines what happens if/when you connect drafts with different pic numbers. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics and ends in the output draft such that all structures repeat at the even intervals across along width and length of the cloth. If the `do not repeat inputs to match size` is selected, unset rows will be added to drafts with fewer pics. 

## Application
No established application, but a fun way to see how to apply binary math to the production of drafts. Retains the pattern of raised warp ends (black cells) from each input draft when they are overlaid. (Keeps any region that is marked black/true in either draft)

## Developer
adacad id: `overlay`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/overlay/overlay.ts
```