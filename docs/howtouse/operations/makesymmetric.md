---
title: make symmetric
sidebar_label: make symmetric
tags: [transformation]
---
# makesymmetric
![file](./img/makesymmetric.png)
## Parameters
- `options`: a list of options for 4-way and 2-way symmetry. Each option specifies the corner that will become the center of the design when rotated
- `center repeat removed?`: in some cases where designs are pointed, the rotational duplicates the final point of the design. You can remove the center end or pick to preserve pointed structures. 

## Description
Rotates and 'stamps' the input draft around a corner, creating rotational symmetry around the selected point according to the parameters described below.

## Application
to create structures with rotational symmetry

## Developer
adacad id: `makesymmetric`
