---
title: interlace wefts
sidebar_label: interlace wefts
tags: [advanced, compound]
---
# interlace
![file](./img/interlace.png)

## Description
Creates a new draft by taking one pic from each input and assigning them to successive pics in the output draft.

## Parameters
- `calculate repeats`: this defines what happens if/when you connect drafts with different pic numbers. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics in the output draft such that all structures repeat at the even intervals across along length of the cloth. If the `do not repeat inputs to match size` is selected, unset rows will be added to drafts with fewer pics. 

## Inlets


## Application
Combines two structures into a compound structure. For instance, for overshot, you might interlace a tabby into a floating structure, the alternating tabby pics would add structure, the floats would add surface color and texture

## Developer
adacad id: `interlace`
