---
title: variable width sampler
sidebar_label: variable width sampler
tags: [advanced, cloth]
---
# variable width sampler
Given a series of letters and numbers (a100 b200 c300), this operation will associate a draft with each letter, and then arrange those drafts from left to right following the pattern order. The numbers next to each letter describe the number of ends upon which the specified pattern should be repeated

![file](./img/sample_width.png)


## Parameters
- `pattern`: a list of letters followed with no space by a number (e.g. a20 b40), that determines which draft will repeat in which order. The number following each letter specifies across how many ends the pattern "a" will be repeated. 

## Inlets
- `weft-pattern`: this optional inlet allows you to assign weft materials and systems to the output. 

## Dynamic Inlets
A single inlet will be created for each letter in your pattern. For example, if your pattern is "a20 b40 a60" it will create inlets for a and b. The draft you connect to each of those inlets will be treated as a repeating block and will repeat across the ends specified in the pattern. 

:::note
When this operation is given input drafts with a different number of pics, it automatically expands the number of pics in the output such that each pattern will repeat evenly from top to bottom. For example, if the inputs have 5 pics and 6 pics, the output will have 30 pics (the least common multiple of 5 and 6) and each input pattern will be repeated within those regions. 
:::



## Application
Can be used for creating several sample swatches across the width of the cloth

## Developer
adacad id: `sample_width`
