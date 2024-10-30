---
title: join top
sidebar_label: join top
tags: [cloth]
---
# join top
![file](./img/join_top.png)

## Description
Joins drafts assigned to the inlets vertically.



## Parameters
- `calculate repeats`: this defines what happens if/when you connect drafts with different numbers of warp ends. If `repeat inputs to match size` is selected, AdaCAD will expand the number of ends in the output draft such that all structures repeat at the even intervals across along width of the cloth. If the `do not repeat inputs to match size` is selected, unset ends will be added to drafts with fewer ends. 


## Inlets
- `draft`: connect all the drafts that you would like to arrange from left to right. The first draft connected will be closest to the origin. 

- `warp pattern`: option to connect a draft that defines the warp colors and systems to use across the output draft



## Application
To arrange different structures across rows

## Developer
adacad id: `join top`
