---
title: pattern across width
sidebar_label: pattern across width
tags: [advanced, dynamic, cloth]
---
# warp profile
![file](./img/warp_profile.png)
## Parameters
- `pattern`: a series of letters, separated by a space, that describe the order in which you'd like the drafts to repeat.

## Inlets
`weft-pattern`: this optional inlet allows you to assign weft materials and systems to the output. 

## Dynamic Inlets
A single inlet will be created for each letter in your pattern. For example, if your pattern is "a a b b c c d d" it will create inlets for a, b, c, and d. The draft you connect to each of those inlets will be treated as a repeating block and will repeat the amount of times indicated by the pattern. 


## Description
Given a series of letters (a b c, etc), this operation will associate a draft with each letter, and then arrange those drafts from left to right following the pattern order

:::note
When this operation is given input drafts with a different number of pics, it automatically expands the output region such that each pattern will repeat evenly. For example, if the inputs have 5 pics and 6 pics, the output will have 30 pics (the least common multiple of 5 and 6) and the input patterns will be filled within those regions. 

![file](./img/warp_profile_helper.png)
:::


## Application
Can be used for profile drafting and describing repeating patterns across the cloth.Can be helpful for making blocks for threading plans. 

## Developer
adacad id: `warp_profile`
