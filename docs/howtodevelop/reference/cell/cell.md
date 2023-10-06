# Cell

This is a single cell or square within a [drawdown](drawdown). Unlike typical drafting where a cell can only be marked black, to raise a heddle at the cell's location, or white to indicate it as lowered, AdaCAD Cells can hold three values: 
- heddle-up (black)
- heddle-down (white)
- unset (light blue)

An unset heddle is functionally the same as a heddle down, but it can be used to indicate to the weaver that a weft yarn will not be used at this location, for instance, when shape weaving or using supplemental wefts that do not span the entire cloth width. 


For this reason, the "Cell" object in AdaCAD holds two values
-  `is_up` describing the position of the heddle as true/up/raised or false/down/lowered
- `is_set` relating to whether or not a weft travels over the warp at this location. `is_set` value can be set/true or unset/false. 

The assignments are: 




```jsx title="src/app/core/model/datatypes.js"
export interface Cell{
  is_set: boolean,
  is_up: boolean
}

```

The following designations are applied for each combination of values of `is_up` and `is_set`

| `is_set` | `is_up` | meaning |
| ----------- | ----------- |----------|
| true | true | heddle is up / lifted
| true| false | heddle is down / lowered
| false | true | heddle is unset
| false | false | heddle is unset

There are a number of helper features to assist in easily getting, setting, and reading cell values in a file located at: [src/app/core/model/cell.js](https://github.com/UnstableDesign/AdaCAD/blob/main/src/app/core/model/cell.ts)
