---
title: variable length sampler
sidebar_label: variable length sampler
tags: [advanced, cloth]
---
# variable length sampler
Given a series of letters and numbers (a100 b200 c300), this operation will associate a draft with each letter, and then arrange those drafts from top to bottom following the pattern order. The numbers next to each letter describe the number of pics upon which the specified pattern should be repeated

![file](./img/sample_length.png)



## Parameters
- `pattern`: a list of letters followed with no space by a number (e.g. a20 b40), that determines which draft will repeat in which order. The number following each letter specifies across how many pics the pattern "a" will be repeated. 

## Inlets
- `warp-pattern`: this optional inlet allows you to assign warp materials and systems to the output. 

## Dynamic Inlets
A single inlet will be created for each letter in your pattern. For example, if your pattern is "a20 b40 a60" it will create inlets for a and b. The draft you connect to each of those inlets will be treated as a repeating block and will repeat across the pics specified in the pattern. 


:::note
When this operation is given input drafts with a different number of ends, it automatically expands the number of ends in the output such that each pattern will repeat evenly from left to right. For example, if the inputs have 5 ends and 6 ends, the output will have 30 ends (the least common multiple of 5 and 6) and each input pattern will be repeated across those additional ends. 
:::



## Application
Can be used for creating several sample swatches across the width of the cloth

## Developer
adacad id: `sample_length`

