---
title: create material sequence
sidebar_label: create material sequence
sidebar_class_name: color opItem
editUrl: 'https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/material_sequence/material_sequence.ts'
---

import {OperationHeader} from '@site/src/components/OperationPage';

<OperationHeader name='material_sequence' />

## Parameters
- `sequence`: a list of numbers that represent the assignment of picks or ends to colors. Every material in AdaCAD is given a unique numeric ID. You can create color sequences by creating lists of those IDs. For example, if white is 1, orange is 2 and yellow is 3, the sequence 1 1 1 2 2 3 would assign the first three ends/picks to white, then the next two to orange, and the next one to orange. 

- `role`: describes if the sequence should be generated horizontally (as a warp coloring), vertically (for weft coloring), or both. 

## Inlets
- none

## Application
To quickly create color sequences to apply to drafts. It is particularly useful for creating irregular or non-repeating color sequences, such as those based on data values (like Tempestries) or perhaps gradients that use color sequencing to crate a shift in colors across the cloth.

## Developer
adacad id: `material_sequence`

```ts reference
https://github.com/UnstableDesign/AdaCAD/tree/main/packages/adacad-drafting-lib/src/operations/material_sequence/material_sequence.ts
```