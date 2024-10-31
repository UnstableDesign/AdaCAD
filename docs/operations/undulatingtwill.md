---
title: undulating twill
sidebar_label: undulating twill
tags: [advanced, structure]
---
# undulating twill
![file](./img/undulatingtwill.png)


## Description
Twill is a family of weave structures in which weft picks pass over or under one or more warp threads in a repeating pattern. In this context, and undulating twill means tha the structure can shift by a non-repeating series of values, instead of by the same value on each pic (as is typically the case in twills)

## Parameters
- `first pic pattern`: the number of warps to raise and lower in the pattern pic. For instance 1 3 1 3 is interpreted as 1 warp raised, 3 lowered, 1 raised, 3 lowered. The number of the picks in the structure is calculated as the sum of these values. 
- `shift pattern`: this sequence of numbers determines how many warps to shift the pattern pick on each subsequent pick. A value of 0 does not shift at all while a value of 3 would shift the original starting pattern 3 times to the right or left.
- `S/Z`:  determines if the shift on each pic moves to the right or left. 



## Application
Allows for the creation and customization of curving structures. 

## Developer
adacad id: `undulatingtwill`
