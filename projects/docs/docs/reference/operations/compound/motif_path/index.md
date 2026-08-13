---
title: motif to path
sidebar_label: motif to path
sidebar_class_name: compound opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/motif_path/motif_path.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='motif_path' />

## Parameters

- `add incidentals` - this parameter controls how the spaces between each motif block are interpreted. If set to no, the motif will be shifted along the path as described, and no effort will be made to resolve repeats between the edges of the motif. If set to yes, the the edges of each motif will be checked such that the neighboring warps strictly increase or decrease by one weft as one moves to the left and right. 

## Inlets

- `path` - this draft controls the path the motif will be repeated along. Only one value, the value closest to the origin, per warp row will be used in the calculation. 

- `motif` - this draft describes the motif, or repeating draft block, that will be repeated and shifted according to the path. If nothing is supplied, the motif for crackle weave is used. 


## History and Rationale
This operation originated as a proof-of-concept implementation of crackle weave, where a motif is repeated along a path, with 'incidental' warps added where needed to connect motifs. We changed the name from "crackle" to "motif to path" to keep the operation general and to suggest that this may not, in fact, be a perfect reflection of crackle weave as described in the texts below. Also, since you can change the motif, the range of paths that can be created creates a larger set of patterns beyond those that would be identified as crackle. 



## Application
This is a great option for creating threadings/treadlings that resemble crackle weave structures. 

<img width="618" height="862" alt="image" src="https://github.com/user-attachments/assets/7b982d71-2360-48a1-86a8-5f69e1f3af59" />

## References
* Ralph Griswold - [Pattern book](https://www2.cs.arizona.edu/patterns/weaving/webdocs/gre_crk3.pdf), and guide [part 1](https://www2.cs.arizona.edu/patterns/weaving/webdocs/gre_crk1.pdf), [part 2](https://www2.cs.arizona.edu/patterns/weaving/webdocs/gre_crk2.pdf), [part 3](https://www2.cs.arizona.edu/patterns/weaving/webdocs/gre_crk3.pdf)
* He references [Harriet Tidball](https://archive.org/details/weaversbookfunda027212mbp/page/n139/mode/2up)
* Berta Fray's "Designing and Drafting for Handweavers" for crackle rules


## Developer
adacad id: `motif_path`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/motif_path/motif_path.ts
```