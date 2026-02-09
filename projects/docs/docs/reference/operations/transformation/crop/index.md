---
title: crop
sidebar_label: crop
sidebar_class_name: transformation opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/crop/crop.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='crop' />

## Parameters
- `ends from start`: specifies the starting position of the crop in ends. 
- `pics from start`: specifies the starting position of the crop in pics. 
- `width`: specifies how many warp ends to keep
- `height`: : specifies how many weft picks to keep


## Application
To pick a section out of a draft that you might want to modify

## Additional Information
You can also use [trim](./trim) to do the same thing using different parameters.

## Developer
adacad id: `crop`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/crop/crop.ts
```