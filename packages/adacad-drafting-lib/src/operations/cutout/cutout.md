---
title: cut, (a, b) => (a NAND b)
sidebar_label: cut, (a, b) => (a NAND b)
tags: [advanced, compute]
---
# cut, (a, b) => (a NAND b)
Applies binary math to two drafts. To do so, it looks at each interlacement in input drafts a and b. If a and b are both marked as having warped raised, it changes the value to warp lowered, effectively cutting the black cells in b from a. This is the opposite of mask


## Parameters
- `shift ends`: shifts the position of the ends in draft a
- `shift pics`: shifts the position of the pics in draft a
- `calculate repeats`: this defines what happens if/when you connect drafts with different pic numbers. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics and ends in the output draft such that all structures repeat at the even intervals across along width and length of the cloth. If the `do not repeat inputs to match size` is selected, unset rows will be added to drafts with fewer pics. 

## Application
No established application, but a fun way to see how to apply binary math to the production of drafts.

## Developer
adacad id: `cutout`
