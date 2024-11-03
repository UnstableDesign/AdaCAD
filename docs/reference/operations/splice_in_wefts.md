---
title: splice in pics
sidebar_label: splice in pics
tags: [advanced, compound]
---
# splice in pics
![file](./img/splice_in_wefts.png)

## Description
Splices the pics of the `splicing draft` input draft into the `receiving draft`. You can use the parameters to describe if you want the entire draft spliced in, or to splice the draft in pic by pic and the amount of pics between each insertion.

## Parameters
- `pics between insert`: a number describing how many weft pics of the receiving draft should occur before switching to the splicing draft. 
- `calculate repeats`: this defines what happens if/when you connect drafts with different pic numbers. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics in the output draft such that all input structures repeat at the even intervals across along length of the cloth. If the `do not repeat inputs to match size` the smaller draft will integrated, but not repeated, into the larger draft.
- `splice style`: users have the option to integrate the splicing draft into the receiving draft in two ways. The first, `line by line` integrates the splicing draft one line at a time. If `whole draft` is selected, the entire splicing draft is inserted into the receiving draft. 

## Application
Can be used when you need to insert a material with a certain property (say elastic) even so many pics to control the level of stretch. Alternatively, pics can be inserted to bind layers together. 

## Developer
adacad id: `splice in wefts`
