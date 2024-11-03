---
title: interlace warps
sidebar_label: interlace warps
tags: [advanced, compound]
---
# interlace warps
![file](./img/interlacewarps.png)

## Description
Creates a new draft by taking one end from each input and assigning and sequencing between those ends in the output draft.

## Parameters
- `calculate repeats`: this defines what happens if/when you connect drafts with different numbers of warp ends. If `repeat inputs to match size` is selected, AdaCAD will expand the number of ends in the output draft such that all structures repeat at the even intervals across along width of the cloth. If the `do not repeat inputs to match size` is selected, unset ends will be added to drafts with fewer ends. 

## Inlets
- `drafts`: connect all the drafts you would like to interlace
- `weft system map`: an optional field if you'd like to assign each weft pic in the output to a specific color or system sequence. 

## Application
Combines two structures into a compound structure.

## Developer
adacad id: `interlacewarps`
