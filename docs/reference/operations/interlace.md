---
title: interlace wefts
sidebar_label: interlace wefts
tags: [advanced, compound]
---
# interlace wefts
Creates a new draft by taking one pic from each input draft and assigning them to successive pics in the output draft.

![file](./img/interlace.png)

## Parameters
- `calculate repeats`: this defines what happens if/when you connect drafts with different pic numbers. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics in the output draft such that all input structures repeat at the even intervals across along length of the cloth. If the `do not repeat inputs to match size` the smaller draft will integrated, but not repeated, into the larger draft. 

## Inlets
- `drafts`: connect all the drafts you would like to interlace
- `warp system map`: an optional field if you'd like to assign each warp in the output to a specific color or system sequence. 


## Application
Combines two structures into a compound structure. For instance, for overshot, you might interlace a tabby into a floating structure, the alternating tabby pics would add structure, the floats would add surface color and texture

## Developer
adacad id: `interlace`
