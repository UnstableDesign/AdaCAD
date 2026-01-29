
## Parameters
- `sequence`: a series of numbers that specify the ordering of materials in the sequence. For example, if our draft uses the following materials: 

- - 0: black
- - 1: white
- - 2: green

 the sequence 0 0 1 1 2 2 will create a draft of one pic long with 6 warps. the first warp will be assigned color 0, the second warp will be assigned color 0, third color 1, and so on.  


-  `orientation`: determines if you would like to create this sequence along the warp, weft, or both warp and weft. 

## Application
This can be helpful for creating long an non-repeating color sequences to apply to projects. For instance, a gradient would be specified as:

` 1 1 1 2 1 1 2 1 2 1 2 2 1 2 2 2`

This can also be used to create color associations or threading based on data sets. For instance, if you would like your warp to be determined by average annual temperature over 100 years, each digit could represent a year and the value of the digit could represent the temperature that year. 

## Tip
You can attach this draft to "set warp materials", "set weft materials" or "set materials and systems" operation to assign this sequence to a draft. 

## Developer
adacad id: `material_sequence`
