---
title: mask, (a,b) => (a AND b)
sidebar_label: mask, (a,b) => (a AND b)
tags: [advanced]
draft: true
---
# mask
<!--![file](./img/mask.png)-->

## Description
Applies binary math to two drafts. To do so, it looks at each interlacement in input drafts a and b  If a is marked warp raised and b marked warp raised, it sets the corresponding interlacement in the output draft to warp raised. Otherwise, the interlacement is marked warp lowered. This effectively masks draft a with draft b

## Parameters
- tbd

## Application
No established application, but a fun way to see how to apply binary math to the production of drafts. Retains input draft b in regions where input draft a has raised warp ends (black cells); draft b is only retained within the area of draft a.
## Developer
adacad id: mask
