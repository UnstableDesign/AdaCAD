---
title: random tree
sidebar_label: random tree
sidebar_class_name: structure opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/rand_tree/rand_tree.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='rand_tree' />

## Parameters
- `ends`: the number of ends in the structure
- `pics`: the number of pics in the structure
- `prob of new branch`: A probability (from 1-100) that describes how likely a new branch will form as the algorithm travels down the picks. 
- `prob of grow out`: A probability (from 1-100) that the branch grow horizontally. 

## Application
A fun exploration of generative structures that can be used or manipulated within the creation of a design. 

## Developer
adacad id: `rand_tree`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/rand_tree/rand_tree.ts
```