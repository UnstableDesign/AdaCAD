---
title: set interlacement to unset
sidebar_label: set interlacement to unset
sidebar_class_name: transformation opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/set_interlacement_to_unset/set_interlacement_to_unset.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='set_interlacement_to_unset' />

## Parameters
- `raised/lowered`: specifies if the raised or lowered interlacements should be converted to "unset" 


## Application
Unset cells allows someone to describe shaped or inlay elements in a cloth. Set interlacements of one type to unset will have the effect of specifying an area where no weft will travel
## Developer
adacad id: `set down to unset`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/set_interlacement_to_unset/set_interlacement_to_unset.ts
```