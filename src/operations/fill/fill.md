---
title: fill
sidebar_label: fill
tags: [advanced, cloth]
---
# fill
Fills black cells of the first input, “pattern,” with the draft specified by the second input, and the white cells with draft specified by the third input.

![file](./img/fill.png)



## Parameters
- none



## Inlets
- `pattern`: a draft describing the regions you would like to fill (or replace) with the input structure
- `black cell structure`: the structure to replace all black (warp raised) cells with
- `white cell structure`: the structure to replace all white (warp raised) interlacements with


## Application
Fill can be used to create graphic regions on cloth. For instance, the input draft can contain a simple graphic drawn in black/warp raised cells, the fill operation then, can fill the black cells with a structure, such as a shaded satin, so that the heart is visible and well structured on the resulting cloth.

## Developer
adacad id: `fill`
