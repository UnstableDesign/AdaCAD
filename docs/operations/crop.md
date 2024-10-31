---
title: crop
sidebar_label: crop
tags: [advanced, tranformation]
---
# crop
![file](./img/crop.png)

## Description
Crops the structure or pattern to a region of the input draft. The crop size and placement are defined by the parameters. This operation follows a model similar to graphics editing software where one specifies the x,y coordinates of the top left of the crop and then the width and height to "cut out". You can also use [trim](./trim) to do the same thing using different parameters.


## Parameters
- `ends from start`: specifies the starting position of the crop in ends. 
- `pics from start`: specifies the starting position of the crop in pics. 
- `width`: specifies how many warp ends to keep
- `height`: : specifies how many weft picks to keep


## Application
To pick a section out of a draft that you might want to modify

## Developer
adacad id: `crop`
