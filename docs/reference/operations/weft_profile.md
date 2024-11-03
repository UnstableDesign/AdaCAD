---
title: pattern across length
sidebar_label: pattern across length
tags: [advanced, cloth]
---
# pattern across length
![file](./img/weft_profile.png)


## Description
Given a series of letters (a b c), this operation will associate a draft with each letter, and then arrange following the pattern order 


## Parameters
- `pattern`: a series of letters, separated by a space, that describe the order in which you'd like the drafts to repeat.

## Inlets
`warp-pattern`: this optional inlet allows you to assign warp materials and systems to the output. 

## Dynamic Inlets
A single inlet will be created for each letter in your pattern. For example, if your pattern is "a a b b c c d d" it will create inlets for a, b, c, and d. The draft you connect to each of those inlets will be treated as a repeating block and will repeat the amount of times indicated by the pattern. 


:::note
When this operation is given input drafts with a different number of warp ends, it automatically expands the output region such that each pattern will repeat evenly along the warp. For example, if the inputs have 5 pics and 6 ends, the output will have 30 ends (the least common multiple of 5 and 6) and the input patterns will be filled within those regions. 

![file](./img/weft_profile_helper.png)
:::


## Application
Can be used for profile drafting and describing repeating patterns along the length the cloth. Can also be useful for creating treadlings and lift plans from component patterns. 

## Developer
adacad id: `weft_profile`
