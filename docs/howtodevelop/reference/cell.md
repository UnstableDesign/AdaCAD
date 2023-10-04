---
sidebar_position: 2
---
# Cell

This is a single cell or square within the draft. Unlike typical drafting where a cell can be either marked black, to raised a heddle at the cell's location, and white if it is left lowered, AdaCAD Cells can hold three values: heddle-up, heddle-down, or unset. An unset heddle is functionally the same as a heddle down, but it can be used to indicate to the weaver that a weft yarn will not be used at this location, for instance, when shape weaving or using supplemental wefts that do not span the entire cloth width. 


For this reason, the "Cell" object in AdaCAD holds two values, one `is_up` describing the position of the heddle as up/raised or down/lowered (true and false respectively), and the second `is_set` relating to whether or not a weft travels over the warp at this location. `is_set` value can be set/true or unset/false. 



```jsx title="src/app/core/model/datatypes.js"
export interface Cell{
  is_set: boolean,
  is_up: boolean
}

```

There are a number of helper features to assist in easily getting, setting, and reading cell values in a file located at: [src/app/core/model/cell.js](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/model/cell.ts)
