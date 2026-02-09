---
title: make symmetric
sidebar_label: make symmetric
sidebar_class_name: transformation opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/makesymmetric/makesymmetric.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='makesymmetric' />

## Parameters
- `options`: a list of options for 4-way and 2-way symmetry. Each option specifies the corner that will become the center of the design when rotated
- `center repeat removed?`: in some cases where designs are pointed, the rotational duplicates the final point of the design. You can remove the center end or pick to preserve pointed structures. 

## Application
to create structures with rotational symmetry

## Developer
adacad id: `makesymmetric`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/makesymmetric/makesymmetric.ts
```