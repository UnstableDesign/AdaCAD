---
title: join left
sidebar_label: join left
tags: [cloth]
---
# join left
![file](./img/join_left.png)


## Description
Joins drafts assigned to the drafts input together horizontally.

## Parameters
- `calculate repeats`: this defines what happens if/when you connect drafts with different pic numbers. If `repeat inputs to match size` is selected, AdaCAD will expand the number of pics in the output draft such that all structures repeat at the even intervals across along length of the cloth. If the `do not repeat inputs to match size` is selected, unset rows will be added to drafts with fewer pics. 

## Inlets
- `draft`: connect all the drafts that you would like to arrange from left to right. The first draft connected will be closest to the origin. 

- `weft pattern`: option to connect a draft that defines the weft colors and systems to use across the output draft



## Application
To arrange different structures across columns

## Developer
adacad id: `join left`
