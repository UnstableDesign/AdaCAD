---
title: selvedge
sidebar_label: selvedge
tags: [advanced, helper]
---
# selvedge
Adds a selvedge of so many ends on both sides of the input draft, 'draft.' The second input, 'selvedge,' determines the selvedge pattern, and if none is given, a selvedge is generated.

![file](./img/selvedge.png)

## Parameters
- `ends` - how many ends of selvedge to add to each side of the draft
- `right shift` - shifts the pics of the selvedge on the right of the draft by the specified amount

## Inlets
- `draft` - the draft to wrap the selvedge around
- `selvedge` - the structure to use within the selvedge

## Application
Adding selvedges to the sides of the cloth maintains clean edges

## Developer
adacad id: `selvedge`
