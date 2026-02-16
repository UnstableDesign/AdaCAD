---
title: layer
sidebar_label: layer
sidebar_class_name: compound opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/layer/layer.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='layer' />

The image below shows the simulated output of the operation above. Note the tabby structure on the top layer and basket on the bottom layer. 

![file](./layer_extra.png)


## Parameters
- none

## Inlets
- `drafts` - connect all the drafts that you'd like to assemble into layers. The resulting structure will have as many layers are there are drafts connected. 

## Application
To arrange different structures on different layers

## Developer
adacad id: `layer`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/layer/layer.ts
```