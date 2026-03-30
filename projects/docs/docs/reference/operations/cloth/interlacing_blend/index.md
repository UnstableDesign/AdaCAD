---
title: interlacing blend
sidebar_label: interlacing blend 
sidebar_class_name: cloth opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/interlacing_blend/interlacing_blend.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='interlacing_blend' /> 

 
## Parameters
- `blend-region-length`: the length of the blend region
- `blend center percent`: the center of the blend transition as a percent from 0 to 100
- `change pattern size`: adds or subtracts from the common repeated pattern size
- `blend direction`: controls whether the blend runs horizontally or vertically

## Inlets
- `draft-a`: the first draft to blend
- `draft-b`: the second draft to blend


## Application
Can be used to create a transition vertically or horizontally between patterns through interlacement. Create the look of a blend/gradient.

## Developer
adacad id: `interlacing blend`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/interlacing_blend/interlacing_blend.ts